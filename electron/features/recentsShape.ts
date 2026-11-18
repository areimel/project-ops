import { createHash } from "node:crypto";
import { isAbsolute } from "node:path";

export interface RecentFile {
  path: string;
  name: string;
  openedAt: number;
}

export const MAX_RECENTS = 12;

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** The id the renderer sees for a recent file: 16 hex of sha1(path). */
export const recentId = (path: string): string => createHash("sha1").update(path).digest("hex").slice(0, 16);

/**
 * Validates the persisted recents list: drops malformed entries and duplicate paths (first wins, the
 * list is newest first) and caps the length. Anything that is not an array heals to [].
 */
export function healRecents(raw: unknown): RecentFile[] {
  if (!Array.isArray(raw)) return [];
  const out: RecentFile[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    if (out.length >= MAX_RECENTS) break;
    if (!isRecord(r)) continue;
    const { path, name, openedAt } = r;
    if (typeof path !== "string" || !isAbsolute(path) || seen.has(path)) continue;
    if (typeof name !== "string" || typeof openedAt !== "number" || !Number.isFinite(openedAt)) continue;
    seen.add(path);
    out.push({ path, name, openedAt });
  }
  return out;
}

/** Puts a path first (newest first), removing any earlier entry for it, and caps the list. */
export function withRecent(list: readonly RecentFile[], path: string, name: string, now: number): RecentFile[] {
  return [{ path, name, openedAt: now }, ...list.filter((r) => r.path !== path)].slice(0, MAX_RECENTS);
}
