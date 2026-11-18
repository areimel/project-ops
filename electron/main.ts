import { app, protocol } from "electron";
import { brand } from "../shared/brand";
import { setupDevCapture } from "./devCapture";
import { deliverDeepLink, markRendererGone, registerDeepLinks } from "./features/deepLink";
import { argvTargets } from "./features/deepLinkParse";
import { queueLaunchFile } from "./features/files";
import { log } from "./features/logger";
import { APP_SCHEME_ENTRY, applyDevCsp, registerAppProtocol } from "./features/appProtocol";
import { registerMediaProtocol, MEDIA_SCHEME_ENTRY, clearServed } from "./features/media";
import { shutdownTimer } from "./features/timer";
import { setPreventSleep } from "./features/powerSave";
import { createTray, hasTray } from "./features/tray";
import { registerIpc } from "./ipc/index";
import { buildMenu } from "./menu";
import { applySettingsToNative } from "./store/settings";
import { createWindow, getWindow, handleBeforeQuit, lockDownContents, lockDownSession, showWindow } from "./window";

function shutdown(): void {
  setPreventSleep(false);
  clearServed();
  shutdownTimer();
}

function openMainWindow(): void {
  createWindow({ canHideToTray: hasTray, onClosed: markRendererGone });
}

/** A command line (first launch or a second instance): a deep link and/or a text file to open. */
function routeArgv(argv: readonly string[], cwd: string): void {
  const { link, file } = argvTargets(argv, cwd);
  if (link) deliverDeepLink(link);
  if (file) queueLaunchFile(file); // last, so a named file lands on the Editor
}

if (process.platform === "win32") app.setAppUserModelId(brand.appId);
protocol.registerSchemesAsPrivileged([APP_SCHEME_ENTRY, MEDIA_SCHEME_ENTRY]); // privileged schemes: once, before ready

process.on("uncaughtException", (e) => log.error("main", "Uncaught exception", e));
process.on("unhandledRejection", (e) => log.error("main", "Unhandled rejection", e));

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (_e, argv, cwd) => {
    showWindow();
    routeArgv(argv, cwd);
  });
  app.on("web-contents-created", (_e, contents) => lockDownContents(contents));
  app.on("open-file", (e, path) => { e.preventDefault(); queueLaunchFile(path); }); // macOS
  app.on("activate", () => { if (!getWindow()) openMainWindow(); });                // macOS dock click
  app.on("before-quit", (e) => { handleBeforeQuit(e); if (!e.defaultPrevented) shutdown(); });
  // The app stays alive without a window on macOS only. With close-to-tray the window is hidden, not closed.
  app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, () => { shutdown(); app.exit(0); });
  }
  registerDeepLinks(deliverDeepLink);

  void app.whenReady().then(() => {
    log.info("main", `Starting ${brand.name} ${app.getVersion()} (${process.platform}, electron ${process.versions.electron})`);
    lockDownSession();
    registerMediaProtocol();
    const dev = process.env.VITE_DEV_SERVER_URL;
    if (dev) applyDevCsp(dev); else registerAppProtocol();
    registerIpc();
    openMainWindow();
    applySettingsToNative();
    const win = getWindow();
    if (win) setupDevCapture(win);
    createTray();
    buildMenu();
    const { file } = argvTargets(process.argv, process.cwd());
    if (file) queueLaunchFile(file);
  });
}
