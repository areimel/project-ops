import { useLayoutEffect, useSyncExternalStore } from "react";
import { resolveMode, type ResolvedMode, type ThemeId } from "../../shared/theme";
import { useSettings } from "../hooks/useSettings";
import { ensureContrast, inkFor, isHex } from "./color";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribe(cb: () => void): () => void {
  const q = window.matchMedia(DARK_QUERY);
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
}
const systemDark = () => window.matchMedia(DARK_QUERY).matches;

/** True while the OS prefers dark; follows `nativeTheme` and updates live. */
export function useSystemDark(): boolean {
  return useSyncExternalStore(subscribe, systemDark, () => false);
}

const ACCENT_PROPS = ["--accent", "--accent-ink", "--accent-text"] as const;

/**
 * Sets `data-theme` and `data-mode` on `root` and applies (or clears) the accent override.
 * Also used before React mounts, with `window.app.initialTheme`.
 */
export function applyTheme(root: HTMLElement, theme: ThemeId, mode: ResolvedMode, accent: string | null = null): void {
  root.dataset.theme = theme;
  root.dataset.mode = mode;
  for (const p of ACCENT_PROPS) root.style.removeProperty(p);
  if (!accent || !isHex(accent)) return;
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-ink", inkFor(accent));
  // As text or a thin line the accent must still read on the sheet: nudge it toward the page ink.
  const cs = getComputedStyle(root);
  const [surface, text] = [cs.getPropertyValue("--surface").trim(), cs.getPropertyValue("--text").trim()];
  root.style.setProperty("--accent-text", isHex(surface) && isHex(text) ? ensureContrast(accent, surface, text) : accent);
}

/** Call once in the shell. Keeps `<html>` in step with the saved theme, mode and accent. */
export function useTheme(): { theme: ThemeId; mode: ResolvedMode } {
  const [settings] = useSettings();
  const dark = useSystemDark();
  const mode = resolveMode(settings.mode, dark);
  useLayoutEffect(() => {
    applyTheme(document.documentElement, settings.theme, mode, settings.accent);
  }, [settings.theme, mode, settings.accent]);
  return { theme: settings.theme, mode };
}
