import type { DeepLink } from "../../shared/ipc/app";

export type Route = { view: "home" } | { view: "settings" } | { view: "app"; appId: string; recordId: string | null };
export type RouterAction = { type: "home" } | { type: "settings" } | { type: "open"; appId: string; recordId?: string }
  | { type: "deep-link"; link: DeepLink };

const HOME: Route = { view: "home" };

function open(appId: string | undefined, recordId: string | undefined, appIds: readonly string[]): Route {
  if (!appId || !appIds.includes(appId)) return HOME;
  return { view: "app", appId, recordId: recordId ?? null };
}

/** Pure. An unknown app (from a stale link or a removed demo) goes home. */
export function routerReducer(_route: Route, action: RouterAction, appIds: readonly string[]): Route {
  switch (action.type) {
    case "home": return HOME;
    case "settings": return { view: "settings" };
    case "open": return open(action.appId, action.recordId, appIds);
    case "deep-link": {
      const { view, appId, recordId } = action.link;
      if (view === "settings") return { view: "settings" };
      return view === "app" ? open(appId, recordId, appIds) : HOME;
    }
  }
}

/** True when moving between the two routes leaves the sheet that is on screen (so a navigation guard applies). */
export function leavesSheet(from: Route, to: Route): boolean {
  if (from.view === "app" && to.view === "app") return from.appId !== to.appId;
  return from.view !== to.view;
}
