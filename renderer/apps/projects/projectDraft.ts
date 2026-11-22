// The edit dialog's form state and the patch it sends. Pure: no React, no DOM.
import { isoDate, line, strList, text } from "../../../shared/collections/heal";
import {
  PROJECT_LIMITS, PROJECT_LINK_KEYS, healLink, overrideText, type ProjectLinkKey, type ProjectSite, type ProjectStatus,
} from "../../../shared/projects/record";
import type { ProjectPatch } from "../../../shared/projects/patch";
import type { ProjectView } from "../../../shared/projects/view";

/** Every field as the form holds it; "" in name, description or a link means "not set by you". */
export interface ProjectDraft {
  name: string;
  description: string;
  category: string;
  tags: string[];
  status: ProjectStatus;
  pinned: boolean;
  links: Record<ProjectLinkKey, string>;
  site: SiteDraft;
}

/** The site details as the form holds them; launchDate "" means none. */
export interface SiteDraft { client: string; hosting: string; launchDate: string; services: string[]; notes: string }

export function draftFromView(p: ProjectView): ProjectDraft {
  return {
    name: p.overrides.name ?? "",
    description: p.overrides.description ?? "",
    category: p.category,
    tags: p.tags.slice(),
    status: p.status,
    pinned: p.pinned,
    links: { repo: p.overrides.links.repo ?? "", site: p.overrides.links.site ?? "", docs: p.overrides.links.docs ?? "" },
    site: {
      client: p.site.client, hosting: p.site.hosting, launchDate: p.site.launchDate ?? "",
      services: p.site.services.slice(), notes: p.site.notes,
    },
  };
}

/** Why a link field cannot be saved, or null when it is empty or a usable https address. */
export function linkProblem(text: string): string | null {
  const s = text.trim();
  if (s === "") return null;
  if (s.length > PROJECT_LIMITS.link) return "This address is too long.";
  return healLink(s) === null ? "Use a full https:// address." : null;
}

/** Why the launch date cannot be saved, or null when it is empty or a real calendar date. */
export const dateProblem = (value: string): string | null =>
  value.trim() === "" || isoDate(value.trim()) !== null ? null : "Use a full date.";

export const draftInvalid = (d: ProjectDraft): boolean =>
  PROJECT_LINK_KEYS.some((k) => linkProblem(d.links[k]) !== null) || dateProblem(d.site.launchDate) !== null;

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Only the fields that differ from what is stored; null when nothing changed. Invalid links are left out. */
export function draftPatch(p: ProjectView, d: ProjectDraft): ProjectPatch | null {
  const out: ProjectPatch = {};
  const name = overrideText(d.name, PROJECT_LIMITS.name);
  if (name !== p.overrides.name) out.name = name;
  const description = overrideText(d.description, PROJECT_LIMITS.description);
  if (description !== p.overrides.description) out.description = description;
  const category = line(d.category, PROJECT_LIMITS.category);
  if (category !== p.category) out.category = category;
  if (!sameList(d.tags, p.tags)) out.tags = d.tags.slice();
  if (d.status !== p.status) out.status = d.status;
  if (d.pinned !== p.pinned) out.pinned = d.pinned;
  const links: Partial<Record<ProjectLinkKey, string | null>> = {};
  for (const k of PROJECT_LINK_KEYS) {
    if (linkProblem(d.links[k]) !== null) continue;
    const next = d.links[k].trim() === "" ? null : healLink(d.links[k]);
    if (next !== p.overrides.links[k]) links[k] = next;
  }
  if (Object.keys(links).length > 0) out.links = links;
  const site = sitePatch(p, d.site);
  if (site) out.site = site;
  return Object.keys(out).length > 0 ? out : null;
}

/** Only the site keys that differ from what is stored, normalised as the patch heal does; null when none. */
function sitePatch(p: ProjectView, d: SiteDraft): Partial<ProjectSite> | null {
  const out: Partial<ProjectSite> = {};
  const cur = p.site;
  const client = line(d.client, PROJECT_LIMITS.client);
  if (client !== cur.client) out.client = client;
  const hosting = line(d.hosting, PROJECT_LIMITS.hosting);
  if (hosting !== cur.hosting) out.hosting = hosting;
  if (dateProblem(d.launchDate) === null) {
    const launch = d.launchDate.trim() === "" ? null : d.launchDate.trim();
    if (launch !== cur.launchDate) out.launchDate = launch;
  }
  const services = strList(d.services, PROJECT_LIMITS.services, PROJECT_LIMITS.service);
  if (!sameList(services, cur.services)) out.services = services;
  const notes = text(d.notes, PROJECT_LIMITS.notes);
  if (notes !== cur.notes) out.notes = notes;
  return Object.keys(out).length > 0 ? out : null;
}
