import { screen, type BrowserWindow } from "electron";
import { readJson, writeJson } from "./jsonStore";
import { fitToDisplays, healWindowState, type WindowState } from "./windowStateShape";

export type { WindowState };
export { fitToDisplays, healWindowState };

const FILE = "window-state.json";

/** The saved state, fitted to the displays that are connected now. */
export function loadWindowState(): WindowState {
  return fitToDisplays(readJson(FILE, healWindowState), screen.getAllDisplays().map((d) => d.workArea));
}

/** Saves on resize/move (500 ms debounce) and on close. A maximised window keeps its normal bounds. */
export function trackWindowState(win: BrowserWindow): void {
  let timer: NodeJS.Timeout | null = null;
  const save = (): void => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (win.isDestroyed() || win.isMinimized() || win.isFullScreen()) return;
    writeJson(FILE, { bounds: win.getNormalBounds(), maximized: win.isMaximized() } satisfies WindowState);
  };
  const later = (): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(save, 500);
  };
  win.on("resize", later);
  win.on("move", later);
  win.on("maximize", later);
  win.on("unmaximize", later);
  win.on("close", save);
}
