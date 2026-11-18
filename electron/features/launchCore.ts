import { brand } from "../../shared/brand";
import { EDITOR_IDS, TERMINAL_IDS, type LauncherKind } from "../../shared/launchers";

// Pure helpers for launch.ts: the environment handed to spawned programs, the PATH lookup, error wording and
// the choice of launcher. No child_process or electron here, so vitest can load it.

const STRIP_PREFIXES = ["ELECTRON_", "VITE_", `${brand.envPrefix}_`];
const STRIP_KEYS = new Set(["CHROME_DESKTOP", "NODE_OPTIONS"]);

/**
 * A copy of `env` for a program we start. Electron (and the AppImage/.deb wrappers) change a few variables for
 * themselves; an editor or terminal that inherits them can misbehave. Never mutates `env`.
 */
export function childEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (key === "ORIGINAL_XDG_CURRENT_DESKTOP") continue;
    if (STRIP_KEYS.has(key) || STRIP_PREFIXES.some((p) => key.startsWith(p))) continue;
    out[key] = value;
  }
  const original = env.ORIGINAL_XDG_CURRENT_DESKTOP;
  if (original !== undefined && original !== "") out.XDG_CURRENT_DESKTOP = original;
  return out;
}

const DEFAULT_PATHEXT = ".COM;.EXE;.BAT;.CMD";

const isAbsoluteDir = (dir: string, win: boolean): boolean =>
  win ? /^[A-Za-z]:[\\/]/.test(dir) || dir.startsWith("\\\\") : dir.startsWith("/");

/**
 * The absolute file `command` resolves to in the PATH folders, or null. `exists` is injected (the caller checks
 * the file system). Only absolute PATH entries are considered: an empty or relative entry (`.`, `bin`, `::`)
 * would search the current folder, which for a project launch is a folder we did not write (CWE-427).
 * A command with a path separator is never accepted, so this cannot be pointed at an arbitrary file.
 */
export function resolveOnPath(
  command: string,
  pathVar: string,
  exists: (file: string) => boolean,
  platform: NodeJS.Platform,
  pathExt?: string,
): string | null {
  if (!command || command.includes("/") || command.includes("\\")) return null;
  const win = platform === "win32";
  const sep = win ? ";" : ":";
  const dirs = pathVar.split(sep)
    .map((d) => (win ? d.replace(/^"(.*)"$/, "$1") : d))
    .filter((d) => d !== "" && isAbsoluteDir(d, win));
  let names = [command];
  if (win) {
    const exts = (pathExt || DEFAULT_PATHEXT).split(";").filter(Boolean).map((e) => e.toLowerCase());
    const hasExt = exts.some((e) => command.toLowerCase().endsWith(e));
    if (!hasExt) names = exts.map((e) => command + e);
  }
  const join = (dir: string, name: string) => (dir.endsWith(win ? "\\" : "/") ? dir + name : dir + (win ? "\\" : "/") + name);
  for (const dir of dirs) {
    for (const name of names) {
      const file = join(dir, name);
      if (exists(file)) return file;
    }
  }
  return null;
}

/** Is `command` on PATH (absolute entries only)? See resolveOnPath. */
export function onPath(
  command: string, pathVar: string, exists: (file: string) => boolean, platform: NodeJS.Platform, pathExt?: string,
): boolean {
  return resolveOnPath(command, pathVar, exists, platform, pathExt) !== null;
}

/** Is `file` the folder `dir` or inside it? Plain string test on real paths; case-insensitive on win32. */
export function isInside(file: string, dir: string, platform: NodeJS.Platform): boolean {
  const win = platform === "win32";
  const norm = (p: string) => {
    const s = win ? p.replace(/\//g, "\\").toLowerCase() : p;
    const sep = win ? "\\" : "/";
    return s.length > 1 && s.endsWith(sep) ? s.slice(0, -1) : s;
  };
  const f = norm(file);
  const d = norm(dir);
  const sep = win ? "\\" : "/";
  return f === d || f.startsWith(d.endsWith(sep) ? d : d + sep);
}

/** The message for a failed spawn. `code` is the Node error code (ENOENT, EACCES, ...). */
export function launchError(label: string, code: string | undefined): string {
  switch (code) {
    case "ENOENT": return `${label} was not found. Choose another in Settings.`;
    case "EACCES":
    case "EPERM": return `${label} could not be started (permission denied). Choose another in Settings.`;
    default: return `${label} could not be started. Choose another in Settings.`;
  }
}

/**
 * Which launcher to use: the preferred id when it is valid for the kind (even if not detected, so the error
 * says so honestly), else the first detected one in table order, else null.
 */
export function resolveLauncher(kind: LauncherKind, preferred: unknown, installed: string[]): string | null {
  const ids: readonly string[] = kind === "editor" ? EDITOR_IDS : TERMINAL_IDS;
  if (typeof preferred === "string" && ids.includes(preferred)) return preferred;
  return ids.find((id) => installed.includes(id)) ?? null;
}
