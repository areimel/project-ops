import { useCallback, useMemo, useReducer, useRef } from "react";
import { APPS } from "../apps/registry";
import { useLatest } from "../hooks/useLatest";
import { fire } from "./ipcSafe";
import { leavesScreen, homeRoute, routerReducer, type Route, type RouterAction } from "./router";
import type { ConfirmOptions } from "./ShellContext";

const APP_IDS = APPS.map((a) => a.id);
const reducer = (route: Route, action: RouterAction): Route => routerReducer(route, action, APP_IDS);

/**
 * Route state plus the navigation guard. `navigate` asks `confirm` first when a screen has set a guard message
 * and the move would leave that screen; the router itself stays pure.
 */
export function useShellNav(confirm: (o: ConfirmOptions) => Promise<boolean>) {
  const [route, dispatch] = useReducer(reducer, homeRoute(APP_IDS));
  const routeRef = useLatest(route);
  const guard = useRef<string | null>(null);

  const navigate = useCallback((action: RouterAction) => {
    const message = guard.current;
    if (!message || !leavesScreen(routeRef.current, reducer(routeRef.current, action))) { dispatch(action); return; }
    void confirm({ title: "Leave this screen?", body: message, confirmLabel: "Leave", cancelLabel: "Stay here", danger: true })
      .then((ok) => { if (ok) dispatch(action); });
  }, [confirm, routeRef]);

  const setGuard = useCallback((message: string | null) => {
    guard.current = message;
    fire(() => window.app.invoke("window:set-guard", message), "Setting the close guard");
  }, []);

  const hasGuard = useCallback(() => guard.current, []);
  return useMemo(() => ({ route, navigate, setGuard, guardMessage: hasGuard }), [route, navigate, setGuard, hasGuard]);
}
