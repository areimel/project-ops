import { app } from "electron";
import { brand, type LinkKey } from "../../shared/brand";
import { markRendererReady } from "../features/deepLink";
import { openLink } from "../features/links";
import { log } from "../features/logger";
import { setMenuContext } from "../menu";
import { sanitizeMenuContext } from "../menuTemplate";
import { confirmClose, setCloseGuard, toggleFullscreen } from "../window";
import { handle } from "./handle";
import { v } from "./validate";

const LOG_PER_MINUTE = 20;
const logTimes: number[] = [];

/** Sliding one-minute limit so a looping renderer cannot fill the disk. */
function logAllowed(now: number): boolean {
  while (logTimes.length && now - logTimes[0] > 60_000) logTimes.shift();
  if (logTimes.length >= LOG_PER_MINUTE) return false;
  logTimes.push(now);
  return true;
}

export function register(): void {
  handle("app:info", v.none, () => ({
    version: app.getVersion(), platform: process.platform, electron: process.versions.electron,
    chrome: process.versions.chrome, node: process.versions.node, isPackaged: app.isPackaged,
  }));
  handle("app:ready", v.none, () => { markRendererReady(); });
  handle("menu:set-context", v.args(sanitizeMenuContext), (ctx) => { setMenuContext(ctx); });
  handle("window:set-guard", v.args(v.nullable(v.string({ max: 500 }))), (message) => { setCloseGuard(message); });
  handle("window:confirm-close", v.none, () => { confirmClose(); });
  handle("window:toggle-fullscreen", v.none, () => { toggleFullscreen(); });
  handle("log:write", v.args(v.oneOf(["info", "warn", "error"] as const), v.line({ max: 2000 })), (level, message) => {
    if (logAllowed(Date.now())) log[level]("renderer", message);
  });
  handle("links:open", v.args(v.oneOf(Object.keys(brand.links) as LinkKey[])), (key) => { openLink(key); });
}
