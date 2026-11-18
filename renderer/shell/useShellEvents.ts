import { useEffect } from "react";
import { useAppEvent } from "../hooks/useAppEvent";
import { useLatest } from "../hooks/useLatest";
import { fire } from "./ipcSafe";
import type { RouterAction } from "./router";
import type { ConfirmOptions } from "./ShellContext";

interface Options {
  navigate(action: RouterAction): void;
  confirm(o: ConfirmOptions): Promise<boolean>;
  guardMessage(): string | null;
}

/** Messages from main that are not menu commands: deep links and the close request. */
export function useShellEvents({ navigate, confirm, guardMessage }: Options): void {
  const nav = useLatest(navigate);
  const ask = useLatest(confirm);
  const guard = useLatest(guardMessage);

  useAppEvent("app:deep-link", (link) => nav.current({ type: "deep-link", link }));

  // Subscribe first (above), then tell main it may flush a link that arrived during start-up.
  useEffect(() => { fire(() => window.app.invoke("app:ready"), "Announcing the window"); }, []);

  useAppEvent("window:close-requested", () => {
    const message = guard.current();
    if (!message) { fire(() => window.app.invoke("window:confirm-close"), "Closing the window"); return; }
    void ask.current({ title: "Close with unsaved changes?", body: message, confirmLabel: "Close anyway", cancelLabel: "Keep open", danger: true })
      .then((ok) => { if (ok) fire(() => window.app.invoke("window:confirm-close"), "Closing the window"); });
  });
}
