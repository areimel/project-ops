import { app, type BrowserWindow } from "electron";
import { writeFileSync } from "node:fs";
import { brand } from "../shared/brand";

const P = brand.envPrefix;
const KEY_GAP_MS = 400;   // a key for a sheet that is still lazy-loading would be lost without a pause

/**
 * Development aid for checking rendering without a person at the screen:
 *   APP_CAPTURE=/path/out.png   screenshot the window, then quit
 *   APP_CAPTURE_DELAY=3000      milliseconds to wait before the screenshot
 *   APP_CAPTURE_KEYS=e,shift+E  keys to press (one per comma) one second after load, KEY_GAP_MS apart
 *   APP_CAPTURE_SIZE=1920x1080  content size of the window
 *   APP_CAPTURE_EVAL=<js>       expression evaluated in the page just before the screenshot; result is logged
 * Renderer console output is echoed to stdout while capturing. The run ends with app.exit, which skips quit
 * guards (unsaved-changes prompts, close-to-tray), so an unattended run never hangs. The screenshot waits for
 * the last key, so a long key list is never cut short by a short delay.
 */
export function setupDevCapture(win: BrowserWindow): void {
  const out = process.env[`${P}_CAPTURE`];
  if (!out || app.isPackaged) return;
  const delay = Number(process.env[`${P}_CAPTURE_DELAY`]) || 3000;
  const keys = (process.env[`${P}_CAPTURE_KEYS`] ?? "").split(",").filter(Boolean);

  const [w, h] = (process.env[`${P}_CAPTURE_SIZE`] ?? "").split("x").map(Number);
  if (w > 0 && h > 0) win.setContentSize(w, h);

  win.webContents.on("console-message", (e) => console.log(`[renderer:${e.level}] ${e.message}`));
  win.webContents.once("did-finish-load", () => {
    setTimeout(() => {
      keys.forEach((key, i) => setTimeout(() => {
        // "shift+E" presses E with Shift held.
        const parts = key.split("+");
        const keyCode = parts.pop() ?? "";
        const modifiers = parts as Array<"shift" | "control" | "alt">;
        win.webContents.sendInputEvent({ type: "keyDown", keyCode, modifiers });
        win.webContents.sendInputEvent({ type: "char", keyCode, modifiers });
        win.webContents.sendInputEvent({ type: "keyUp", keyCode, modifiers });
      }, i * KEY_GAP_MS));
    }, 1000);
    setTimeout(() => {
      const probe = process.env[`${P}_CAPTURE_EVAL`];
      const evaluated = probe
        ? win.webContents.executeJavaScript(probe).then((r) => console.log(`[eval] ${JSON.stringify(r)}`), (e) => console.log(`[eval error] ${e}`))
        : Promise.resolve();
      // Exit whether or not the capture worked. app.quit() would run the quit guards and could hang.
      void evaluated
        .then(() => win.webContents.capturePage())
        .then((image) => writeFileSync(out, image.toPNG()))
        .catch((e) => console.log(`[capture error] ${e}`))
        .finally(() => app.exit(0));
    }, Math.max(delay, 1000 + keys.length * KEY_GAP_MS + 500));
  });
}
