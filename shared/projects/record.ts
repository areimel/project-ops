// The stored project record (projects.json). Main-only: the page never receives a record, only a
// ProjectView (view.ts), and changes one only through a healed ProjectPatch (patch.ts).
import type { CollectionSpec } from "../collections/base";
import { isRecordId } from "../collections/base";
import { bool, boolOrNull, isObject, line, oneOf, strList, timestamp } from "../collections/heal";

export const PROJECT_LIMITS = {
  max: 2000,          // records in projects.json, hidden ones included
  name: 120,
  description: 500,
  category: 48,
  tags: 20,
  tag: 32,
  link: 2048,
  path: 4096,
  branch: 255,
  stack: 24,          // stack ids per project
  stackId: 32,
} as const;

export const PROJECT_STATUSES = ["active", "paused", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_ORIGINS = ["scan", "manual"] as const;
export type ProjectOrigin = (typeof PROJECT_ORIGINS)[number];

export const PROJECT_LINK_KEYS = ["repo", "site", "docs"] as const;
export type ProjectLinkKey = (typeof PROJECT_LINK_KEYS)[number];
export type ProjectLinks = Record<ProjectLinkKey, string | null>;   // https URLs only (healLink)

/** What `projects:open` can open a project in. */
export const OPEN_TARGETS = ["folder", "editor", "terminal"] as const;
export type OpenTarget = (typeof OPEN_TARGETS)[number];

/** Detected facts, replaced wholesale on every scan or refresh. Never edited by the user. */
export interface ProjectScan {
  name: string | null;           // manifest name or folder name; null = not scanned yet
  description: string | null;    // manifest description
  repoUrl: string | null;        // origin remote converted to https
  branch: string | null;         // null when detached or not a repo
  lastCommitAt: number | null;   // ms
  dirty: boolean | null;         // null when not a repo or git failed
  stack: string[];               // stack ids from the scan table
  scannedAt: number | null;      // ms
}

export interface ProjectFields {
  path: string;                  // absolute real path; main only, never sent to the page
  origin: ProjectOrigin;
  rootId: string | null;         // the scan root that found it; null for manual
  missing: boolean;              // folder absent at the last scan or refresh
  hidden: boolean;               // tombstone set by projects:remove
  name: string | null;           // user override; null = detected
  description: string | null;    // user override; null = detected
  category: string;              // "" = uncategorised
  tags: string[];
  status: ProjectStatus;
  pinned: boolean;
  links: ProjectLinks;           // user values; the view falls back to scan.repoUrl for repo
  scan: ProjectScan;
}

/** POSIX `/x`, Windows `C:\x` or `C:/x`, or UNC `\\server\share`. Pure string test (no node:path in shared). */
export function isAbsolutePath(x: unknown): x is string {
  return typeof x === "string" && (x.startsWith("/") || /^[A-Za-z]:[\\/]/.test(x) || x.startsWith("\\\\"));
}

/** The last segment of a path (`/a/b/` gives `b`); the path itself when it has no segment (`/`). */
export function folderName(path: string): string {
  const parts = path.split(/[\\/]+/).filter((s) => s !== "");
  return parts[parts.length - 1] ?? path;
}

/**
 * A safe external link, or null: a string, trimmed, at most PROJECT_LIMITS.link characters, parseable,
 * protocol exactly `https:`, a host, and no user name or password. Returns the normalised `href`.
 */
export function healLink(x: unknown): string | null {
  if (typeof x !== "string") return null;
  const s = x.trim();
  if (s === "" || s.length > PROJECT_LIMITS.link) return null;
  let url: URL;
  try { url = new URL(s); } catch { return null; }
  if (url.protocol !== "https:" || url.hostname === "" || url.username !== "" || url.password !== "") return null;
  return url.href.length > PROJECT_LIMITS.link ? null : url.href;
}

/** Each of repo, site and docs through healLink; anything else is dropped. */
export function healLinks(x: unknown): ProjectLinks {
  const o = isObject(x) ? x : {};
  return { repo: healLink(o.repo), site: healLink(o.site), docs: healLink(o.docs) };
}

/** A text override: `line()` with "" (or a non-string) meaning null, "use the detected value". */
export function overrideText(x: unknown, max: number): string | null {
  const s = line(x, max);
  return s === "" ? null : s;
}

export function emptyScan(): ProjectScan {
  return { name: null, description: null, repoUrl: null, branch: null, lastCommitAt: null, dirty: null, stack: [], scannedAt: null };
}

export function healScan(x: unknown): ProjectScan {
  if (!isObject(x)) return emptyScan();
  return {
    name: overrideText(x.name, PROJECT_LIMITS.name),
    description: overrideText(x.description, PROJECT_LIMITS.description),
    repoUrl: healLink(x.repoUrl),
    branch: overrideText(x.branch, PROJECT_LIMITS.branch),
    lastCommitAt: timestamp(x.lastCommitAt),
    dirty: boolOrNull(x.dirty),
    stack: strList(x.stack, PROJECT_LIMITS.stack, PROJECT_LIMITS.stackId),
    scannedAt: timestamp(x.scannedAt),
  };
}

/** A whole stored record's fields. Never throws; null when there is no usable absolute path. */
export function healProject(raw: unknown): ProjectFields | null {
  if (!isObject(raw)) return null;
  const path = raw.path;
  if (!isAbsolutePath(path) || path.length > PROJECT_LIMITS.path || path.includes("\0")) return null;
  return {
    path,
    origin: oneOf(raw.origin, PROJECT_ORIGINS, "manual"),
    rootId: isRecordId(raw.rootId) ? raw.rootId : null,
    missing: bool(raw.missing, false),
    hidden: bool(raw.hidden, false),
    name: overrideText(raw.name, PROJECT_LIMITS.name),
    description: overrideText(raw.description, PROJECT_LIMITS.description),
    category: line(raw.category, PROJECT_LIMITS.category),
    tags: strList(raw.tags, PROJECT_LIMITS.tags, PROJECT_LIMITS.tag),
    status: oneOf(raw.status, PROJECT_STATUSES, "active"),
    pinned: bool(raw.pinned, false),
    links: healLinks(raw.links),
    scan: healScan(raw.scan),
  };
}

/** Not in any table the page can name: only main opens it (openCollection(projectSpec)). */
export const projectSpec: CollectionSpec<ProjectFields> = {
  name: "projects", version: 1, max: PROJECT_LIMITS.max, heal: healProject,
};
