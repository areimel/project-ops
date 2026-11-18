// The edit dialog's form state and the patch it sends. Pure: no React, no DOM.
import {
  PROJECT_LIMITS, PROJECT_LINK_KEYS, healLink, type ProjectLinkKey, type ProjectStatus,
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
}

export function draftFromView(p: ProjectView): ProjectDraft {
  return {
    name: p.overrides.name ?? "",
    description: p.overrides.description ?? "",
    category: p.category,
    tags: p.tags.slice(),
    status: p.status,
    pinned: p.pinned,
    links: { repo: p.overrides.links.repo ?? "", site: p.overrides.links.site ?? "", docs: p.overrides.links.docs ?? "" },
  };
}

/** Why a link field cannot be saved, or null when it is empty or a usable https address. */
export function linkProblem(text: string): string | null {
  const s = text.trim();
  if (s === "") return null;
  if (s.length > PROJECT_LIMITS.link) return "This address is too long.";
  return healLink(s) === null ? "Use a full https:// address." : null;
}

export const draftInvalid = (d: ProjectDraft): boolean => PROJECT_LINK_KEYS.some((k) => linkProblem(d.links[k]) !== null);

/** A collapsed single line, as main's heal stores it; "" becomes null. */
function override(text: string, max: number): string | null {
  const s = text.replace(/\s+/g, " ").trim().slice(0, max);
  return s === "" ? null : s;
}

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Only the fields that differ from what is stored; null when nothing changed. Invalid links are left out. */
export function draftPatch(p: ProjectView, d: ProjectDraft): ProjectPatch | null {
  const out: ProjectPatch = {};
  const name = override(d.name, PROJECT_LIMITS.name);
  if (name !== p.overrides.name) out.name = name;
  const description = override(d.description, PROJECT_LIMITS.description);
  if (description !== p.overrides.description) out.description = description;
  const category = d.category.replace(/\s+/g, " ").trim().slice(0, PROJECT_LIMITS.category);
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
  return Object.keys(out).length > 0 ? out : null;
}
