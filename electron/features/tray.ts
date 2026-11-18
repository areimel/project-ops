import { Menu, Tray, app, nativeImage } from "electron";
import { brand } from "../../shared/brand";
import { showWindow } from "../window";
import { assetPath } from "./assets";
import { log } from "./logger";

// Icon from assetPath("tray.png"); menu: Show <name>, status line, Quit. Where there is no tray
// (or no icon file) createTray logs and leaves hasTray() false; nothing else depends on it.
let tray: Tray | null = null;
let status: string | null = null;

const alive = (): Tray | null => (tray && !tray.isDestroyed() ? tray : null);

function render(): void {
  const t = alive();
  if (!t) return;
  t.setToolTip(status ? `${brand.name}: ${status}` : brand.name);
  if (process.platform === "darwin") t.setTitle(status ?? "");
  t.setContextMenu(Menu.buildFromTemplate([
    { label: `Show ${brand.name}`, click: () => showWindow() },
    ...(status ? [{ label: status, enabled: false }] : []),
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]));
}

export function createTray(): void {
  if (alive()) return;
  try {
    const icon = nativeImage.createFromPath(assetPath("tray.png"));
    if (icon.isEmpty()) { log.warn("tray", "No tray icon found; running without a tray"); return; }
    tray = new Tray(process.platform === "darwin" ? icon.resize({ width: 18, height: 18 }) : icon);
    tray.on("click", () => showWindow());
    render();
  } catch (e) {
    tray = null;
    log.warn("tray", "Could not create a tray icon", e);
  }
}

/** Tooltip, macOS menu-bar title and a disabled status item in the menu. null clears it. */
export function setTrayStatus(text: string | null): void {
  if (text === status) return;
  status = text;
  render();
}

export function hasTray(): boolean {
  return alive() !== null;
}
