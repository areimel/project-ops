// The path-free view of a project: the only shape of a project the page ever receives.
import type { RecordBase } from "../collections/base";
import {
  folderName, type ProjectFields, type ProjectLinks, type ProjectOrigin, type ProjectStatus,
} from "./record";

export type ProjectRecord = RecordBase & ProjectFields;

export interface ProjectView {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;                  // override ?? scan.name ?? folder name
  description: string | null;    // override ?? scan.description
  category: string;
  tags: string[];
  status: ProjectStatus;
  pinned: boolean;
  missing: boolean;
  origin: ProjectOrigin;
  links: ProjectLinks;           // effective: repo falls back to scan.repoUrl
  folder: string;                // display text from displayPath (`~/…/a/b`), never the path
  branch: string | null;
  lastCommitAt: number | null;
  dirty: boolean | null;
  stack: string[];
  scannedAt: number | null;
  lastOpenedAt: number | null;   // when it was last opened from the app (editor, terminal or folder)
  /** The user's own stored values, for the edit form (null = not overridden). */
  overrides: { name: string | null; description: string | null; links: ProjectLinks };
  /** What the scan found, for placeholders and "Use detected". */
  detected: { name: string; description: string | null; repo: string | null };
}

/** The links main opens and the page shows: the user's, with repo falling back to the detected remote. */
export function effectiveLinks(record: ProjectFields): ProjectLinks {
  return { ...record.links, repo: record.links.repo ?? record.scan.repoUrl };
}

/** Pure; `displayPath` is injected (main passes its home-relative display function) so shared/ needs no Node. */
export function toProjectView(record: ProjectRecord, displayPath: (abs: string) => string): ProjectView {
  const { scan } = record;
  const detectedName = scan.name ?? folderName(record.path);
  return {
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    name: record.name ?? detectedName,
    description: record.description ?? scan.description,
    category: record.category,
    tags: record.tags.slice(),
    status: record.status,
    pinned: record.pinned,
    missing: record.missing,
    origin: record.origin,
    links: effectiveLinks(record),
    folder: displayPath(record.path),
    branch: scan.branch,
    lastCommitAt: scan.lastCommitAt,
    dirty: scan.dirty,
    stack: scan.stack.slice(),
    scannedAt: scan.scannedAt,
    lastOpenedAt: record.lastOpenedAt,
    overrides: { name: record.name, description: record.description, links: { ...record.links } },
    detected: { name: detectedName, description: scan.description, repo: scan.repoUrl },
  };
}

/** Visible records as views, hidden ones left out, in stored order. */
export function toProjectViews(records: readonly ProjectRecord[], displayPath: (abs: string) => string): ProjectView[] {
  return records.filter((r) => !r.hidden).map((r) => toProjectView(r, displayPath));
}
