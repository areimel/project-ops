// What the page may change on a project: user fields only, healed key by key.
import { isObject, line, strList } from "../collections/heal";
import {
  PROJECT_LINK_KEYS, PROJECT_LIMITS, PROJECT_STATUSES, healLink, overrideText,
  type ProjectFields, type ProjectLinks, type ProjectStatus,
} from "./record";

export interface ProjectPatch {
  name?: string | null;          // null or "" = use the detected name
  description?: string | null;   // null or "" = use the detected description
  category?: string;             // "" = uncategorised
  tags?: string[];
  status?: ProjectStatus;
  pinned?: boolean;
  links?: Partial<ProjectLinks>; // only the keys sent; null or "" clears one
}

/**
 * Keeps only user fields with valid values; `path`, `origin`, `rootId`, `missing`, `hidden`, `scan` and
 * unknown keys are ignored. An invalid value drops that key (or that one link), it never becomes a default.
 */
export function healProjectPatch(raw: unknown): ProjectPatch {
  const out: ProjectPatch = {};
  if (!isObject(raw)) return out;
  if (raw.name === null || typeof raw.name === "string") out.name = overrideText(raw.name, PROJECT_LIMITS.name);
  if (raw.description === null || typeof raw.description === "string") {
    out.description = overrideText(raw.description, PROJECT_LIMITS.description);
  }
  if (typeof raw.category === "string") out.category = line(raw.category, PROJECT_LIMITS.category);
  if (Array.isArray(raw.tags)) out.tags = strList(raw.tags, PROJECT_LIMITS.tags, PROJECT_LIMITS.tag);
  if (PROJECT_STATUSES.includes(raw.status as ProjectStatus)) out.status = raw.status as ProjectStatus;
  if (typeof raw.pinned === "boolean") out.pinned = raw.pinned;
  if (isObject(raw.links)) {
    const links: Partial<ProjectLinks> = {};
    for (const key of PROJECT_LINK_KEYS) {
      const v = raw.links[key];
      if (v === null || (typeof v === "string" && v.trim() === "")) links[key] = null;
      else {
        const url = healLink(v);
        if (url !== null) links[key] = url;
      }
    }
    if (Object.keys(links).length > 0) out.links = links;
  }
  return out;
}

/**
 * The record's fields with a healed patch applied; `links` is merged key by key, so a patch that sends
 * only `links.site` keeps repo and docs. Main passes the result to `collection.update(id, ...)`.
 */
export function applyProjectPatch(current: ProjectFields, patch: ProjectPatch): ProjectFields {
  const { links, ...rest } = patch;
  return { ...current, ...rest, links: { ...current.links, ...links } };
}
