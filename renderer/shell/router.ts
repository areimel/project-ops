import type { DeepLink } from "../../shared/ipc/app";

export type Route = { view: "settings" } | { view: "app"; appId: string; recordId: string | null };
export type RouterAction = { type: "home" } | { type: "settings" } | { type: "open"; appId: string; recordId?: string }
  | { type: "deep-link"; link: DeepLink };

/** The home screen is the first app. */
export function homeRoute(appIds: readonly string[]): Route {
  return { view: "app", appId: appIds[0] ?? "", recordId: null };
}

function open(appId: string | undefined, recordId: string | undefined, appIds: readonly string[]): Route {
  if (!appId || !appIds.includes(appId)) return homeRoute(appIds);
  return { view: "app", appId, recordId: recordId ?? null };
}

/** Pure. "home" and an unknown app (from a stale link) go to the first app. */
export function routerReducer(_route: Route, action: RouterAction, appIds: readonly string[]): Route {
  switch (action.type) {
    case "home": return homeRoute(appIds);
    case "settings": return { view: "settings" };
    case "open": return open(action.appId, action.recordId, appIds);
    case "deep-link": {
      const { view, appId, recordId } = action.link;
      if (view === "settings") return { view: "settings" };
      return view === "app" ? open(appId, recordId, appIds) : homeRoute(appIds);
    }
  }
}

/** True when moving between the two routes leaves the screen that is showing (so a navigation guard applies). */
export function leavesScreen(from: Route, to: Route): boolean {
  if (from.view === "app" && to.view === "app") return from.appId !== to.appId;
  return from.view !== to.view;
}
