import { brand } from "./brand";
import { isObject } from "./collections/heal";
import { isThemeId, type ThemeId } from "./theme";

export type ModeSetting = "system" | "light" | "dark";
export interface Settings {
  theme: ThemeId;            // from shared/theme.ts
  mode: ModeSetting;
  accent: string | null;     // ^#[0-9a-f]{6}$ override of --accent, null = theme accent
  closeToTray: boolean;      // default false
  notifications: boolean;    // default true
}
export const SETTINGS_VERSION = 1;               // file settings.json = { version, values }

const MODES: readonly ModeSetting[] = ["system", "light", "dark"];
const HEX = /^#[0-9a-fA-F]{6}$/;

export function defaultSettings(): Settings {     // theme/mode from brand
  return {
    theme: isThemeId(brand.defaultTheme) ? brand.defaultTheme : "blueprint",
    mode: brand.defaultMode,
    accent: null, closeToTray: false, notifications: true,
  };
}

/** Keeps only the keys whose value is valid, so a patch and a stored file share one rule set. */
export function healSettingsPatch(raw: unknown): Partial<Settings> {
  const out: Partial<Settings> = {};
  if (!isObject(raw)) return out;
  if (isThemeId(raw.theme)) out.theme = raw.theme;
  if (MODES.includes(raw.mode as ModeSetting)) out.mode = raw.mode as ModeSetting;
  if (raw.accent === null) out.accent = null;
  else if (typeof raw.accent === "string" && HEX.test(raw.accent)) out.accent = raw.accent.toLowerCase();
  if (typeof raw.closeToTray === "boolean") out.closeToTray = raw.closeToTray;
  if (typeof raw.notifications === "boolean") out.notifications = raw.notifications;
  return out;
}

/**
 * What a parsed settings.json is: usable (`ok`, including a bare values object), written by a newer
 * version (`newer`: read defaults, never overwrite), or not settings at all (`damaged`).
 */
export function classifySettingsFile(raw: unknown): "ok" | "newer" | "damaged" {
  if (!isObject(raw)) return "damaged";
  if (!isObject(raw.values)) return "values" in raw || "version" in raw ? "damaged" : "ok";
  if (typeof raw.version !== "number") return "damaged";
  return raw.version > SETTINGS_VERSION ? "newer" : "ok";
}

/**
 * Accepts the stored envelope `{ version, values }` or a bare values object. A file written by a newer
 * version (higher `version`) is not understood and gives the defaults; missing or bad keys get defaults.
 */
export function healSettings(raw: unknown): Settings {
  let values: unknown = raw;
  if (isObject(raw) && isObject(raw.values)) {
    if (typeof raw.version !== "number" || raw.version > SETTINGS_VERSION) return defaultSettings();
    values = raw.values;
  }
  return { ...defaultSettings(), ...healSettingsPatch(values) };
}
