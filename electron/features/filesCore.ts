// Pure parts of files.ts (no electron import, so tests can load them).
import { dirname } from "node:path";

/**
 * A file name that is safe to hand a save dialog: the last path segment only, no control or reserved
 * characters, no leading/trailing dots or spaces, at most 120 characters. Falls back to `fallback`.
 */
export function safeFileName(raw: string, fallback = "Untitled"): string {
  const last = raw.split(/[\\/]/).pop() ?? "";
  const cleaned = last.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "_").replace(/^[.\s]+|[.\s]+$/g, "").slice(0, 120).trim();
  return cleaned === "" ? fallback : cleaned;
}

export const FOLDER_DISPLAY_MAX = 40;

/**
 * Shortens a folder path to `max` characters by dropping middle segments: `~/…/deep/leaf`. The first segment
 * and as many of the last ones as fit stay. A last segment that is itself too long is cut at its start.
 */
export function elideMiddle(dir: string, max = FOLDER_DISPLAY_MAX): string {
  if (dir.length <= max) return dir;
  const sep = dir.includes("/") ? "/" : "\\";
  const parts = dir.split(sep);
  const head = parts[0] === "" ? sep : `${parts[0]}${sep}`;   // "/" for an absolute path, "~/" or "C:\\" otherwise
  const tail: string[] = [];
  let used = head.length + 2;                                   // the head and "…" plus its separator
  for (let i = parts.length - 1; i > 0; i--) {
    const next = used + parts[i].length + 1;
    if (next > max && tail.length > 0) break;
    tail.unshift(parts[i]);
    used = next;
  }
  const rest = tail.join(sep);
  if (head.length + 2 + rest.length > max) return `…${rest.slice(-(max - 1))}`;
  return `${head}…${sep}${rest}`;
}

/** `path` with the home directory shown as "~" (exact folder or a child of it; a lookalike prefix is left alone). */
function shortenHome(path: string, home: string): string {
  if (!home) return path;
  if (path === home) return "~";
  return path.startsWith(`${home}/`) || path.startsWith(`${home}\\`) ? `~${path.slice(home.length)}` : path;
}

/**
 * Display-only text for a folder itself: home shown as "~", and a path longer than `max` keeps its head and its
 * last two segments (`~/…/desktop-app-projects/project-ops`). When even that is too long, elideMiddle cuts further.
 * The renderer gets this short form, never the absolute path, and never sends it back.
 */
export function displayPath(path: string, home: string, max = FOLDER_DISPLAY_MAX): string {
  const short = shortenHome(path, home);
  if (short.length <= max) return short;
  const sep = short.includes("/") ? "/" : "\\";
  const parts = short.split(sep).filter((p, i) => p !== "" || i === 0);
  const head = parts[0] === "" ? sep : `${parts[0]}${sep}`;
  if (parts.length > 3) {
    const kept = `${head}…${sep}${parts.slice(-2).join(sep)}`;
    if (kept.length <= max) return kept;
  }
  return elideMiddle(short, max);
}

/** Display-only text for the folder that holds the file `path` (see displayPath). */
export function displayFolder(path: string, home: string): string {
  return displayPath(dirname(path), home);
}
