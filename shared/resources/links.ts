// The owner's resource links (resource-links.json): shortcuts to hosting tools and the like, shown on the dashboard.
// Main-only collection; the page edits one through a healed ResourceLinkPatch and opens one by id.
import type { CollectionSpec, RecordBase } from "../collections/base";
import { isObject, line } from "../collections/heal";
import { healLink } from "../projects/record";

export const RESOURCE_LIMITS = { max: 100, name: 60, group: 40 } as const;

export interface ResourceLinkFields {
  name: string;      // never empty
  url: string;       // https only, no credentials (healLink)
  group: string;     // "" = ungrouped
}

export interface ResourceLinkView extends ResourceLinkFields { id: string }

/** What the page may send for a new link or an edit: only the keys it wants to set. */
export type ResourceLinkPatch = Partial<ResourceLinkFields>;

/** A stored record's fields; null when the name is empty or the URL is not a safe https link. */
export function healResourceLink(raw: unknown): ResourceLinkFields | null {
  if (!isObject(raw)) return null;
  const name = line(raw.name, RESOURCE_LIMITS.name);
  const url = healLink(raw.url);
  if (name === "" || url === null) return null;
  return { name, url, group: line(raw.group, RESOURCE_LIMITS.group) };
}

/** Keeps only `name`, `url` and `group` with valid values; an invalid value drops that key, it never becomes a default. */
export function healResourceLinkPatch(raw: unknown): ResourceLinkPatch {
  const out: ResourceLinkPatch = {};
  if (!isObject(raw)) return out;
  const name = line(raw.name, RESOURCE_LIMITS.name);
  if (name !== "") out.name = name;
  const url = healLink(raw.url);
  if (url !== null) out.url = url;
  if (typeof raw.group === "string") out.group = line(raw.group, RESOURCE_LIMITS.group);
  return out;
}

export const RESOURCE_MESSAGES = {
  name: "Enter a name.",
  url: "Enter an https link, such as https://example.com.",
  full: `You can keep at most ${RESOURCE_LIMITS.max} links.`,
} as const;

/**
 * Why a raw patch cannot be saved, in the owner's words, or null. A key that was sent but did not survive healing
 * is an error (not a silent no-op); with `requireAll` (a new link) a missing name or URL is one too.
 */
export function resourcePatchProblem(raw: unknown, requireAll: boolean): string | null {
  const sent = isObject(raw) ? raw : {};
  const patch = healResourceLinkPatch(raw);
  if (patch.name === undefined && (requireAll || Object.hasOwn(sent, "name"))) return RESOURCE_MESSAGES.name;
  if (patch.url === undefined && (requireAll || Object.hasOwn(sent, "url"))) return RESOURCE_MESSAGES.url;
  return null;
}

/** Only main opens it (openCollection(resourceLinkSpec)). */
export const resourceLinkSpec: CollectionSpec<ResourceLinkFields> = {
  name: "resource-links", version: 1, max: RESOURCE_LIMITS.max, heal: healResourceLink,
};

export function toResourceLinkView(record: RecordBase & ResourceLinkFields): ResourceLinkView {
  return { id: record.id, name: record.name, url: record.url, group: record.group };
}
