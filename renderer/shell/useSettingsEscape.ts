import { useEffect } from "react";

/** Escape on the Settings screen goes back. A dialog or popover that handles Escape first marks it as handled, and a text field keeps its own Escape. */
export function useSettingsEscape(enabled: boolean, back: () => void): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, back]);
}
