// Scan roots (project-roots.json): parent folders a scan walks. Main-only, like projects.
import type { CollectionSpec, RecordBase } from "../collections/base";
import { isObject } from "../collections/heal";
import { PROJECT_LIMITS, isAbsolutePath } from "./record";

export const ROOT_LIMIT = 20;

export interface RootFields {
  path: string;                  // absolute real path; main only
}

/** What the page sees of a root. */
export interface RootView {
  id: string;
  folder: string;                // display text from displayPath, never the path
  projectCount: number;          // visible (not hidden) projects whose rootId is this root
}

export function healRoot(raw: unknown): RootFields | null {
  if (!isObject(raw)) return null;
  const path = raw.path;
  if (!isAbsolutePath(path) || path.length > PROJECT_LIMITS.path || path.includes("\0")) return null;
  return { path };
}

export const rootSpec: CollectionSpec<RootFields> = {
  name: "project-roots", version: 1, max: ROOT_LIMIT, heal: healRoot,
};

export function toRootView(
  record: RecordBase & RootFields, displayPath: (abs: string) => string, projectCount: number): RootView {
  return { id: record.id, folder: displayPath(record.path), projectCount };
}
