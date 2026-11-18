import { BrowserWindow, app, nativeTheme, screen, session } from "electron";
import { join } from "node:path";
import { brand } from "../shared/brand";
import type { Settings } from "../shared/settings";
import { WINDOW_BG } from "../shared/theme";
import { appUrl } from "./features/appProtocol";
import { emit } from "./ipc/handle";
import { log } from "./features/logger";
import { getSettings, onSettingsChanged } from "./store/settings";
import { fitToDisplays, loadWindowState, trackWindowState, type WindowState } from "./store/windowState";

const MIN = { width: 720, height: 480 };
const DEFAULT_SIZE = { width: 1100, height: 720 };

let win: BrowserWindow | null = null;
let guard: string | null = null;      // set by the renderer while there is unsaved work
let guardConfirmed = false;           // the renderer confirmed the close
let quitting = false;                 // the app is going down; let close through
let quitAfterConfirm = false;         // a guarded quit is waiting for the renderer's answer
let rendererStuck = false;            // the page is hung: it cannot answer, so it cannot hold the window open

export function getWindow(): BrowserWindow | null {
  return win && !win.isDestroyed() ? win : null;
}

/** Brings the window back from hidden, minimised or behind others. */
export function showWindow(): void {
  const w = getWindow();
  if (!w) return;
  if (w.isMinimized()) w.restore();
  if (!w.isVisible()) w.show();
  w.focus();
}

const resolvedMode = (): "light" | "dark" => (nativeTheme.shouldUseDarkColors ? "dark" : "light");
const backgroundFor = (s: Settings): string => WINDOW_BG[s.theme][resolvedMode()];

/** APP_WINDOW_BOUNDS=1280x800 or x,y,w,h: dev aid that overrides saved bounds (ignored when packaged). */
function boundsOverride(): WindowState["bounds"] | undefined {
  const raw = process.env[`${brand.envPrefix}_WINDOW_BOUNDS`];
  if (!raw || app.isPackaged) return undefined;
  const n = raw.split(/[x,]/).map(Number);
  if (n.some((x) => !Number.isFinite(x))) return undefined;
  if (n.length === 2) return { x: Number.NaN, y: Number.NaN, width: n[0], height: n[1] };
  return n.length === 4 ? { x: n[0], y: n[1], width: n[2], height: n[3] } : undefined;
}

export function createWindow(opts: { canHideToTray: () => boolean; onClosed?: () => void }): BrowserWindow {
  const settings = getSettings();
  nativeTheme.themeSource = settings.mode;
  dropGuard(); rendererStuck = false;

  const override = boundsOverride();
  const state = fitToDisplays(loadWindowState(), screen.getAllDisplays().map((d) => d.workArea));
  const b = override ?? state.bounds;
  const placed = b && Number.isFinite(b.x) && Number.isFinite(b.y);

  const w = new BrowserWindow({
    ...(b ? { width: b.width, height: b.height } : DEFAULT_SIZE),
    ...(placed ? { x: b.x, y: b.y } : {}),
    minWidth: MIN.width, minHeight: MIN.height,
    title: brand.name,
    show: false,                                   // shown on ready-to-show: no white flash
    backgroundColor: backgroundFor(settings),
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      additionalArguments: [`--app-theme=${settings.theme}:${resolvedMode()}`],
    },
  });
  win = w;
  if (state.maximized && !override) w.maximize();
  if (!override) trackWindowState(w);

  w.once("ready-to-show", () => w.show());
  w.webContents.once("did-fail-load", (_e, code, desc) => { log.error("window", `Renderer failed to load: ${desc} (${code})`); w.show(); });
  // A crashed or hung page cannot answer "close-requested". Without this the guard would keep the window
  // (and the app) from closing. A hung page that recovers ("responsive") holds the guard again.
  w.webContents.on("render-process-gone", (_e, d) => { log.error("window", `Renderer process gone: ${d.reason}`); dropGuard(); rendererStuck = true; });
  w.webContents.on("unresponsive", () => { log.warn("window", "Renderer is not responding; closing is no longer held"); rendererStuck = true; });
  w.webContents.on("responsive", () => { rendererStuck = false; });
  // A new page (reload, recovery after a crash) starts without unsaved work.
  w.webContents.on("did-start-navigation", (e) => { if (e.isMainFrame && !e.isSameDocument) { dropGuard(); rendererStuck = false; } });

  // Keeps the ground colour in step with the theme so resizes and reloads never flash the wrong one.
  const paint = (): void => { if (!w.isDestroyed()) w.setBackgroundColor(backgroundFor(getSettings())); };
  const offSettings = onSettingsChanged((s) => { nativeTheme.themeSource = s.mode; paint(); });
  nativeTheme.on("updated", paint);

  w.on("close", (e) => {
    if (quitting) return;
    if (getSettings().closeToTray && opts.canHideToTray()) { e.preventDefault(); w.hide(); return; }
    if (guard !== null && !guardConfirmed && !rendererStuck) {
      e.preventDefault();
      quitAfterConfirm = false;                    // this is a window close now, not the quit that was left unanswered
      emit("window:close-requested");
    }
  });
  w.on("closed", () => {
    offSettings();
    nativeTheme.removeListener("updated", paint);
    if (win === w) win = null;
    opts.onClosed?.();
  });

  // The built renderer is served from the app scheme (registerAppProtocol), never from file://.
  void w.loadURL(process.env.VITE_DEV_SERVER_URL ?? appUrl());
  return w;
}

/** No unsaved work: forget the guard, the confirmation and any quit that was waiting on them. */
function dropGuard(): void {
  guard = null; guardConfirmed = false; quitAfterConfirm = false;
}

export function setCloseGuard(message: string | null): void {
  if (message === null) dropGuard();
  else guard = message;
}

/** The renderer confirmed: close the window, or finish the quit that was waiting for it. */
export function confirmClose(): void {
  guardConfirmed = true;
  if (quitAfterConfirm) { quitAfterConfirm = false; quitting = true; app.quit(); return; }
  getWindow()?.close();
}

/** Call from app "before-quit". Holds a quit back while there is unsaved work; the shell asks first. */
export function handleBeforeQuit(e: { preventDefault(): void }): void {
  if (quitting) return;
  const w = getWindow();
  if (w && guard !== null && !guardConfirmed && !rendererStuck) {
    e.preventDefault();
    quitAfterConfirm = true;
    showWindow();
    emit("window:close-requested");
    return;
  }
  quitting = true;
}

export function toggleFullscreen(): void {
  const w = getWindow();
  if (w) w.setFullScreen(!w.isFullScreen());
}

/** Session-wide lockdown, once, before any window: only fullscreen is granted; camera, mic and the rest stay denied. */
export function lockDownSession(): void {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_wc, perm, cb) => cb(perm === "fullscreen"));
  ses.setPermissionCheckHandler((_wc, perm) => perm === "fullscreen");
}

/** Per web contents: no navigation away from the app, no new windows, no webviews. */
export function lockDownContents(contents: Electron.WebContents): void {
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
  contents.on("will-navigate", (e) => e.preventDefault());
  contents.on("will-redirect", (e) => e.preventDefault());
  contents.on("will-attach-webview", (e) => e.preventDefault());
}
