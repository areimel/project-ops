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

/** The tone the footer state is drawn in; "unsaved" and the plain version text are drawn by their own rules over muted. */
export function stateTone(tone: SaveState | "plain"): "success" | "danger" | "muted" {
  return tone === "saved" ? "success" : tone === "error" ? "danger" : "muted";
}

export interface TitleBlockModel {
  name: string;
  view: string;
  count?: string;
  state?: { label: string; tone: SaveState | "plain" };
}

/** Pure: what the footer says. The brand, the view name, the app's count (when it reports one) and the version or save state. */
export function titleBlockModel(route: Route, brandName: string, viewName: string, info: TitleInfo, version: string): TitleBlockModel {
  const plain = { label: `Version ${version}`, tone: "plain" as const };
  if (route.view === "settings") return { name: brandName, view: viewName, state: plain };
  return {
    name: brandName,
    view: viewName,
    count: info.count,
    state: info.saveState ? { label: SAVE_LABEL[info.saveState], tone: info.saveState } : plain,
  };
}
