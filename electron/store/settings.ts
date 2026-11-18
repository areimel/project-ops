import { BrowserWindow, nativeTheme } from "electron";
import { SETTINGS_VERSION, classifySettingsFile, defaultSettings, healSettings, healSettingsPatch, type Settings } from "../../shared/settings";
import { WINDOW_BG } from "../../shared/theme";
import { log } from "../features/logger";
import { quarantineJson, readJsonFile, removeJson, writeJson } from "./jsonStore";

const FILE = "settings.json";
const listeners = new Set<(s: Settings) => void>();
let current: Settings | null = null;
let newer = false;      // the file was written by a newer version: use defaults and never overwrite it
let damaged = false;    // the file exists but is not settings: moved aside before the first write

export function getSettings(): Settings {
  if (current) return current;
  const r = readJsonFile(FILE);
  if (r.status === "missing") return (current = defaultSettings());
  const kind = r.status === "unreadable" ? "damaged" : classifySettingsFile(r.value);
  newer = kind === "newer";
  damaged = kind === "damaged";
  if (newer) log.warn("settings", "settings.json was saved by a newer version; using defaults and leaving the file alone");
  return (current = r.status === "ok" && kind === "ok" ? healSettings(r.value) : defaultSettings());
}

/** Persists unless the file belongs to a newer version; a damaged file is moved aside first, never overwritten. */
function persist(next: Settings): void {
  if (newer) return;
  if (damaged) {
    try { log.warn("settings", `settings.json is unreadable; moved to ${quarantineJson(FILE)}`); damaged = false; } catch (e) {
      log.error("settings", "Could not move the unreadable settings.json aside; not saving", e);
      return;
    }
  }
  writeJson(FILE, { version: SETTINGS_VERSION, values: next });
}

/** nativeTheme follows the mode (menus, dialogs, prefers-color-scheme); the window background follows the theme. */
export function applySettingsToNative(s: Settings = getSettings()): void {
  nativeTheme.themeSource = s.mode;
  const bg = WINDOW_BG[s.theme][nativeTheme.shouldUseDarkColors ? "dark" : "light"];
  for (const win of BrowserWindow.getAllWindows()) if (!win.isDestroyed()) win.setBackgroundColor(bg);
}

function notify(s: Settings): void {
  for (const cb of [...listeners]) {
    try { cb(s); } catch { /* one bad listener must not stop the others */ }
  }
}

/** `patch` is untrusted: unknown and invalid keys are dropped. */
export function updateSettings(patch: unknown): Settings {
  const prev = getSettings();
  const next = { ...prev, ...healSettingsPatch(patch) };
  if ((Object.keys(next) as (keyof Settings)[]).every((k) => next[k] === prev[k])) return prev;
  current = next;
  persist(next);
  applySettingsToNative(next);
  notify(next);
  return next;
}

/** Data reset: back to defaults and the file removed. */
export function resetSettings(): Settings {
  try { removeJson(FILE); } catch { /* nothing to delete */ }
  newer = damaged = false;
  current = defaultSettings();
  applySettingsToNative(current);
  notify(current);
  return current;
}

export function onSettingsChanged(cb: (s: Settings) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
