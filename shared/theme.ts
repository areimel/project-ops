export const THEMES = [{ id: "kojima", name: "Kojima" }] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
export type ResolvedMode = "light" | "dark";

/** --bg per theme and mode, for BrowserWindow backgroundColor. tests/theme.test.ts checks it against the CSS. */
export const WINDOW_BG: Record<ThemeId, { light: string; dark: string }> = {
  kojima: { light: "#EFEBE0", dark: "#141310" },
};
export const isThemeId = (x: unknown): x is ThemeId => THEMES.some((t) => t.id === x);

/** "system" follows the OS preference; anything else is taken as is. */
export function resolveMode(mode: "system" | "light" | "dark", systemDark: boolean): ResolvedMode {
  return mode === "system" ? (systemDark ? "dark" : "light") : mode;
}
