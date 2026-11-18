export const THEMES = [
  { id: "blueprint", name: "Blueprint" }, { id: "graphite", name: "Graphite" }, { id: "kraft", name: "Kraft" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
export type ResolvedMode = "light" | "dark";

/** --bg per theme and mode, for BrowserWindow backgroundColor. tests/theme.test.ts checks it against the CSS. */
export const WINDOW_BG: Record<ThemeId, { light: string; dark: string }> = {
  blueprint: { light: "#EEF2F6", dark: "#0F2A52" },
  graphite: { light: "#F1F2F4", dark: "#23272C" },
  kraft: { light: "#EFE6D6", dark: "#2B2219" },
};
export const isThemeId = (x: unknown): x is ThemeId => THEMES.some((t) => t.id === x);

/** "system" follows the OS preference; anything else is taken as is. */
export function resolveMode(mode: "system" | "light" | "dark", systemDark: boolean): ResolvedMode {
  return mode === "system" ? (systemDark ? "dark" : "light") : mode;
}
