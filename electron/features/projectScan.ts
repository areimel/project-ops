// The folder walk (file system side of projectScanCore.ts). Read-only: it never writes or follows symlinked folders.
import { readdir, realpath } from "node:fs/promises";
import { basename, join } from "node:path";
import { supersededError } from "../../shared/superseded";
import { PROJECT_LIMITS } from "../../shared/projects/record";
import {
  MAX_DEPTH, categoryHint, detectScan, isProjectDir, shouldDescend, type DetectedScan, type FoundProject,
} from "./projectScanCore";
import { readSmallFile } from "./smallFile";

const PACKAGE_JSON_MAX = 512 * 1024;

/** The parsed package.json, or null when missing, not a regular file (symlinks refused), too big or not JSON. */
async function readPackageJson(dir: string): Promise<unknown> {
  const text = await readSmallFile(join(dir, "package.json"), PACKAGE_JSON_MAX);
  if (text === null) return null;
  try { return JSON.parse(text) as unknown; } catch { return null; }
}

async function names(dir: string): Promise<{ names: string[]; dirs: string[] } | null> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });   // isDirectory() is false for symlinks
    return { names: entries.map((e) => e.name), dirs: entries.filter((e) => e.isDirectory()).map((e) => e.name) };
  } catch {
    return null;   // EACCES, ENOENT, ENOTDIR...: skip this folder
  }
}

/**
 * Breadth-first walk of one root, at most MAX_DEPTH levels, stopping at a project (the root itself is a container,
 * never a project). Real paths, deduped. Stops at PROJECT_LIMITS.max results.
 * When `isCurrent()` is false after an await the walk throws `supersededError()` (callers ignore it with
 * `isSuperseded`), so a stale partial result can never reach the store.
 */
export async function scanRoot(root: { id: string; path: string }, isCurrent: () => boolean): Promise<FoundProject[]> {
  const rootReal = await realpath(root.path);
  if (!isCurrent()) throw supersededError();
  const found: FoundProject[] = [];
  const seen = new Set<string>();
  let level = [rootReal];
  for (let depth = 0; depth <= MAX_DEPTH && level.length > 0; depth++) {
    const nextLevel: string[] = [];
    for (const dir of level) {
      const listing = await names(dir);
      if (!isCurrent()) throw supersededError();
      if (listing === null) continue;
      if (depth > 0 && isProjectDir(listing.names)) {
        const real = await realpath(dir).catch(() => dir);
        if (seen.has(real)) continue;
        seen.add(real);
        const pkg = listing.names.includes("package.json") ? await readPackageJson(dir) : null;
        if (!isCurrent()) throw supersededError();
        found.push({ path: real, rootId: root.id, categoryHint: categoryHint(rootReal, real), scan: detectScan(basename(real), listing.names, pkg) });
        if (found.length >= PROJECT_LIMITS.max) return found;
        continue;
      }
      if (depth < MAX_DEPTH) for (const d of listing.dirs) if (shouldDescend(d)) nextLevel.push(join(dir, d));
    }
    level = nextLevel;
  }
  return found;
}

/** Detected facts for one folder added by hand (or refreshed); null when it cannot be read. No git. */
export async function inspectFolder(path: string): Promise<DetectedScan | null> {
  const listing = await names(path);
  if (listing === null) return null;
  const pkg = listing.names.includes("package.json") ? await readPackageJson(path) : null;
  return detectScan(basename(path), listing.names, pkg);
}
