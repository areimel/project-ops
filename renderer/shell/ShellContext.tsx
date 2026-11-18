import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Route, RouterAction } from "./router";
import type { ToastAction, ToastKind } from "../components/common/Toast";
import type { HandlerRegistry } from "./handlerRegistry";
import { useLatest } from "../hooks/useLatest";

export type SaveState = "saved" | "saving" | "unsaved" | "error";
export interface TitleInfo { count?: string; saveState?: SaveState }      // count: "12 notes"
export interface ConfirmOptions { title: string; body?: string; confirmLabel: string; cancelLabel?: string; danger?: boolean }
export interface ShellApi {
  route: Route;
  /** `index` is 0-based (registry position); the title block prints index + 1. */
  sheet: { index: number; total: number } | null;     // null on home and settings
  navigate(action: RouterAction): void;
  toast(kind: ToastKind, message: string, action?: ToastAction): void;
  confirm(o: ConfirmOptions): Promise<boolean>;
  /** Tooltip text for a command id of the active sheet or the shell ("Pin note (Ctrl+P)"), from the command table. */
  hint(id: string): string;
}

/** What the hooks below need from the shell but apps never see. */
export interface ShellInternals {
  registry: HandlerRegistry;
  setTitleInfo(info: TitleInfo | null): void;
  setGuard(message: string | null): void;
}

const ApiContext = createContext<ShellApi | null>(null);
const InternalsContext = createContext<ShellInternals | null>(null);

export function ShellProvider(p: { api: ShellApi; internals: ShellInternals; children: ReactNode }) {
  return (
    <ApiContext.Provider value={p.api}>
      <InternalsContext.Provider value={p.internals}>{p.children}</InternalsContext.Provider>
    </ApiContext.Provider>
  );
}

function need<T>(v: T | null): T {
  if (!v) throw new Error("This hook must be used inside the app shell.");
  return v;
}

export function useShell(): ShellApi { return need(useContext(ApiContext)); }

/** Tooltip text for a command id, read from the command table. */
export function useHint(): (id: string) => string { return useShell().hint; }

/** Sets the title block's count and save state while mounted, and clears them on unmount. */
export function useTitleInfo(info: TitleInfo): void {
  const { setTitleInfo } = need(useContext(InternalsContext));
  useEffect(() => {
    setTitleInfo({ count: info.count, saveState: info.saveState });
    return () => setTitleInfo(null);
  }, [setTitleInfo, info.count, info.saveState]);
}

/** Registers command handlers while mounted. The handler functions may change every render. */
export function useCommandHandlers(handlers: Record<string, () => void>): void {
  const { registry } = need(useContext(InternalsContext));
  const latest = useLatest(handlers);
  const ids = Object.keys(handlers).join("\n");
  useEffect(() => {
    const stable: Record<string, () => void> = {};
    for (const id of ids ? ids.split("\n") : []) stable[id] = () => latest.current[id]?.();
    return registry.register(stable);
  }, [registry, ids, latest]);
}

/** While `message` is set, leaving the sheet or closing the window asks first. Also tells main (window:set-guard). */
export function useNavigationGuard(message: string | null): void {
  const { setGuard } = need(useContext(InternalsContext));
  useEffect(() => {
    setGuard(message);
    return () => setGuard(null);
  }, [setGuard, message]);
}
