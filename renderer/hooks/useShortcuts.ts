import { useEffect } from "react";
import { useLatest } from "./useLatest";
import type { CommandSpec } from "../../shared/commands";

/** Resolves a keydown to a command id among `commands` (their `keys` only), or undefined. */
export function commandForKey(commands: readonly CommandSpec[], e: Pick<KeyboardEvent, "key" | "shiftKey">): string | undefined {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  // "?" (and other shifted symbols) match regardless of the shift flag.
  const symbol = k.length === 1 && k.toLowerCase() === k.toUpperCase();
  for (const c of commands) {
    for (const key of c.keys ?? []) {
      const shift = key.startsWith("Shift+") && key.length > 6;
      const base = shift ? key.slice(6) : key;
      const norm = base.length === 1 ? base.toLowerCase() : base;
      if (norm === k && (symbol || shift === e.shiftKey)) return c.id;
    }
  }
  return undefined;
}

/** The part of an element `ignoresKey` looks at; a real `HTMLElement` fits. */
export interface KeyTarget { tagName?: string; isContentEditable?: boolean; closest(selector: string): unknown }

// A focused control owns Space and Enter: they activate it, so they must not also run a command.
const ACTIVATABLE = 'button, a[href], summary, [role="button"], [role="radio"], [role="switch"], [role="checkbox"], [role="tab"], [role="menuitem"], [role="option"], [role="slider"]';

/** True when a keydown belongs to what has focus (typing, a modifier chord, or a control's activation key) and no command may take it. */
export function ignoresKey(e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey">, t: KeyTarget | null): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  const tag = t?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return true;
  return (e.key === " " || e.key === "Enter") && !!t?.closest(ACTIVATABLE);
}

/**
 * Keyboard dispatcher for plain-key commands. A command without a handler is a no-op and the key is left
 * alone. `enabled` lets the caller suspend all shortcuts (e.g. while a dialog owns the keyboard).
 */
export function useShortcuts(commands: readonly CommandSpec[], handlers: Record<string, () => void>, enabled: boolean): void {
  const cmds = useLatest(commands);
  const hs = useLatest(handlers);
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (ignoresKey(e, e.target as HTMLElement | null)) return;
      const id = commandForKey(cmds.current, e);
      const h = id ? hs.current[id] : undefined;
      if (!h) return;
      e.preventDefault();
      h();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, cmds, hs]);
}
