// Pure decisions for the projects feature (no fs, no electron): root views and counts, removing a root, a new
// manual record, and folding git and folder-exists results into a scan. projects.ts and projectsScanRun.ts do the IO.
import type { RecordBase } from "../../shared/collections/base";
import {
  emptyScan, toRootView,
  type ProjectFields, type ProjectRecord, type ProjectScan, type RootFields, type RootView,
} from "../../shared/projects";
import type { GitInfo } from "./gitInfoCore";
import type { DetectedScan, FoundProject } from "./projectScanCore";

type RootRecord = RecordBase & RootFields;

/** Visible (not hidden) projects per rootId. */
export function countByRoot(projects: readonly ProjectFields[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const p of projects) if (!p.hidden && p.rootId !== null) out.set(p.rootId, (out.get(p.rootId) ?? 0) + 1);
  return out;
}

export function toRootViews(
  roots: readonly RootRecord[], projects: readonly ProjectFields[], displayPath: (abs: string) => string): RootView[] {
  const counts = countByRoot(projects);
  return roots.map((r) => toRootView(r, displayPath, counts.get(r.id) ?? 0));
}

export const visibleCount = (projects: readonly ProjectFields[]): number => projects.filter((p) => !p.hidden).length;

/**
 * The project list after a root is removed: its projects, hidden tombstones included, stay with rootId null
 * (updatedAt bumped). A tombstone is kept because another root may cover the same folder (nested or overlapping
 * roots): dropping it would bring back a project the user removed. Other records are untouched.
 */
export function afterRootRemoved(projects: readonly ProjectRecord[], rootId: string, now: number): ProjectRecord[] {
  return projects.map((p) => (p.rootId === rootId ? { ...p, rootId: null, updatedAt: now } : p));
}

/** `scan` with its git facts replaced by `git` and scannedAt stamped. */
function withGit(scan: ProjectScan, git: GitInfo, now: number): ProjectScan {
  return { ...scan, branch: git.branch, lastCommitAt: git.lastCommitAt, dirty: git.dirty, repoUrl: git.repoUrl, scannedAt: now };
}

/** Scan facts from a folder read: detected parts replace the old ones (kept when the read failed), git replaces git. */
export function scanFacts(prev: ProjectScan, detected: DetectedScan | null, git: GitInfo, now: number): ProjectScan {
  return withGit({ ...prev, ...(detected ?? {}) }, git, now);
}

/** A record for a folder added by hand. */
export function newManualProject(path: string, detected: DetectedScan | null, git: GitInfo, now: number): ProjectFields {
  return {
    path, origin: "manual", rootId: null, missing: false, hidden: false,
    name: null, description: null, category: "", tags: [], status: "active", pinned: false,
    links: { repo: null, site: null, docs: null },
    lastOpenedAt: null,
    scan: scanFacts(emptyScan(), detected, git, now),
  };
}

/** Found paths that get git read: unique, in found order, leaving out paths whose stored record is hidden. */
export function gitTargets(found: readonly FoundProject[], existing: readonly ProjectFields[]): string[] {
  const hidden = new Set(existing.filter((r) => r.hidden).map((r) => r.path));
  return [...new Set(found.map((f) => f.path))].filter((p) => !hidden.has(p));
}

/**
 * Visible records the scan does not settle, whose folder is re-checked so their missing flag is current: not found
 * by this scan and not under a scanned root (manual records, and scan records whose root was removed).
 */
export function statTargets(
  existing: readonly ProjectFields[], found: readonly FoundProject[], scannedRootIds: readonly string[]): string[] {
  const foundPaths = new Set(found.map((f) => f.path));
  const scanned = new Set(scannedRootIds);
  return existing
    .filter((r) => !r.hidden && !foundPaths.has(r.path))
    .filter((r) => !(r.origin === "scan" && r.rootId !== null && scanned.has(r.rootId)))
    .map((r) => r.path);
}

/**
 * Applies git facts (by path) and folder-exists results (by path) to the merged list. Returns the list and how many
 * records the existence check newly marked missing. Records not named in either map are returned unchanged.
 */
export function finishScan<T extends ProjectFields>(
  merged: readonly T[], git: ReadonlyMap<string, GitInfo>, exists: ReadonlyMap<string, boolean>, now: number,
): { next: T[]; newlyMissing: number } {
  let newlyMissing = 0;
  const next = merged.map((rec) => {
    const g = git.get(rec.path);
    if (g) return { ...rec, scan: withGit(rec.scan, g, now) };
    const present = exists.get(rec.path);
    if (present === undefined || present === !rec.missing) return rec;
    if (!present) newlyMissing++;
    return { ...rec, missing: !present };
  });
  return { next, newlyMissing };
}

/** Pairs `keys[i]` with `values[i]`. */
export function zipMap<V>(keys: readonly string[], values: readonly V[]): Map<string, V> {
  return new Map(keys.map((k, i) => [k, values[i]!]));
}
