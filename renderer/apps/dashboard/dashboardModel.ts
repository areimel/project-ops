// What the dashboard shows and the link form's state. Pure: no React, no DOM.
import { line } from "../../../shared/collections/heal";
import { healLink } from "../../../shared/projects/record";
import type { ProjectView } from "../../../shared/projects/view";
import { RESOURCE_LIMITS, type ResourceLinkPatch, type ResourceLinkView } from "../../../shared/resources/links";

export const RECENT_LIMIT = 8;

const byName = (a: { name: string }, b: { name: string }): number =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });

/** Every pinned project, by name, so a tile keeps its place from day to day. */
export function pinnedTiles(projects: readonly ProjectView[]): ProjectView[] {
  return projects.filter((p) => p.pinned).sort(byName);
}

/**
 * The projects opened from the app most recently, newest first. Pinned ones are left out (they are already on
 * screen) and so are missing folders (nothing to open).
 */
export function recentTiles(projects: readonly ProjectView[], limit = RECENT_LIMIT): ProjectView[] {
  return projects
    .filter((p) => p.lastOpenedAt !== null && !p.pinned && !p.missing)
    .sort((a, b) => (b.lastOpenedAt as number) - (a.lastOpenedAt as number) || byName(a, b))
    .slice(0, limit);
}

export interface LinkGroup { group: string; links: ResourceLinkView[] }   // group "" = ungrouped

/**
 * Links under their group: ungrouped first, then groups A to Z, names A to Z inside each. Group names that differ
 * only by case are one group, shown in the spelling that sorts first (capitals before lower case).
 */
export function groupLinks(links: readonly ResourceLinkView[]): LinkGroup[] {
  const groups = new Map<string, LinkGroup>();
  for (const link of [...links].sort((a, b) => (a.group < b.group ? -1 : a.group > b.group ? 1 : 0))) {
    const key = link.group.toLowerCase();
    const g = groups.get(key) ?? { group: link.group, links: [] };
    g.links.push(link);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ group: g.group, links: g.links.sort(byName) }))
    .sort((a, b) => (a.group === "" ? -1 : b.group === "" ? 1 : byName({ name: a.group }, { name: b.group })));
}

/** Group names in use, for the form's suggestions. */
export const knownGroups = (links: readonly ResourceLinkView[]): string[] =>
  groupLinks(links).map((g) => g.group).filter((g) => g !== "");

// ---- the link form

export interface LinkDraft { name: string; url: string; group: string }

export const emptyDraft = (): LinkDraft => ({ name: "", url: "", group: "" });
export const draftFrom = (link: ResourceLinkView): LinkDraft => ({ name: link.name, url: link.url, group: link.group });

/** Why the address cannot be saved, or null when it is empty (not typed yet) or a usable https address. */
export function urlProblem(text: string): string | null {
  const s = text.trim();
  if (s === "") return null;
  return healLink(s) === null ? "Use a full https:// address." : null;
}

/** True while Save must stay off: no name, no address, or an address that is not https. */
export const draftInvalid = (d: LinkDraft): boolean =>
  line(d.name, RESOURCE_LIMITS.name) === "" || healLink(d.url) === null;

/** A new link's fields, or for an edit only the fields that changed (null when none did). Call when not invalid. */
export function draftPatch(d: LinkDraft, original?: ResourceLinkView): ResourceLinkPatch | null {
  const next = { name: line(d.name, RESOURCE_LIMITS.name), url: healLink(d.url) ?? "", group: line(d.group, RESOURCE_LIMITS.group) };
  if (!original) return next;
  const out: ResourceLinkPatch = {};
  if (next.name !== original.name) out.name = next.name;
  if (next.url !== original.url) out.url = next.url;
  if (next.group !== original.group) out.group = next.group;
  return Object.keys(out).length > 0 ? out : null;
}
