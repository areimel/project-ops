import type { ModeSetting } from "../../shared/settings";
import type { Route } from "./router";
import type { SaveState, TitleInfo } from "./ShellContext";

/** system -> light -> dark -> system. */
export function nextMode(mode: ModeSetting): ModeSetting {
  return mode === "system" ? "light" : mode === "light" ? "dark" : "system";
}

export const SAVE_LABEL: Record<SaveState, string> = {
  saved: "Saved", saving: "Saving", unsaved: "Unsaved changes", error: "Save failed",
};

export interface TitleBlockModel {
  name: string;
  sheet: string;
  count?: string;
  state?: { label: string; tone: SaveState | "plain" };
}

/** Pure: what the title block says on each screen. `sheet.index` is 0-based; the block shows index + 1. */
export function titleBlockModel(
  route: Route, brandName: string, appCount: number, appIndex: number, info: TitleInfo, version: string,
): TitleBlockModel {
  if (route.view === "home") {
    return { name: brandName, sheet: "Index", count: `${appCount} ${appCount === 1 ? "sheet" : "sheets"}`, state: { label: `Version ${version}`, tone: "plain" } };
  }
  if (route.view === "settings") {
    return { name: brandName, sheet: "Settings", state: { label: `Version ${version}`, tone: "plain" } };
  }
  return {
    name: brandName,
    sheet: appIndex >= 0 ? `Sheet ${appIndex + 1} of ${appCount}` : "Sheet",
    count: info.count,
    state: info.saveState ? { label: SAVE_LABEL[info.saveState], tone: info.saveState } : undefined,
  };
}

/** Sheet number as printed in the index: 0 -> "01". */
export const sheetNumber = (index: number): string => String(index + 1).padStart(2, "0");

/**
 * Pure: the row to focus after a key press on the sheet index, or null when the key is not ours.
 * Arrows step (no wrap), Home and End jump, digits 1-9 jump to that sheet when it exists.
 */
export function nextSheetIndex(current: number, key: string, count: number): number | null {
  if (count <= 0) return null;
  const last = count - 1;
  if (key === "ArrowDown") return Math.min(last, current + 1);
  if (key === "ArrowUp") return Math.max(0, current - 1);
  if (key === "Home") return 0;
  if (key === "End") return last;
  if (/^[1-9]$/.test(key)) return Number(key) - 1 <= last ? Number(key) - 1 : null;
  return null;
}
