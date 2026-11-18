// Filter state beyond the filter test itself: the tag toggle cycle, the rail's tag list, revealing a
// deep-linked project, and healing what localStorage gives back. Pure: no React, no DOM.
import { PROJECT_LIMITS, PROJECT_STATUSES, type ProjectStatus } from "../../../shared/projects/record";
import type { ProjectView } from "../../../shared/projects/view";
import {
  DEFAULT_SORT, SORT_OPTIONS, UNCATEGORISED, defaultFilters, filterProjects, fold, type Facet, type ProjectFilters, type SortKey,
} from "./projectsModel";

export type TagState = "off" | "include" | "exclude";

export function tagState(f: ProjectFilters, tag: string): TagState {
  const k = fold(tag);
  if (f.tags.some((t) => fold(t) === k)) return "include";
  if (f.excludeTags.some((t) => fold(t) === k)) return "exclude";
  return "off";
}

/** off -> include -> exclude -> off. A tag is never in both lists. */
export function cycleTag(f: ProjectFilters, tag: string): ProjectFilters {
  const k = fold(tag);
  const without = (l: string[]) => l.filter((t) => fold(t) !== k);
  const state = tagState(f, tag);
  if (state === "off") return { ...f, tags: [...f.tags, tag], excludeTags: without(f.excludeTags) };
  if (state === "include") return { ...f, tags: without(f.tags), excludeTags: [...f.excludeTags, tag] };
  return { ...f, tags: without(f.tags), excludeTags: without(f.excludeTags) };
}

/** Clicking a tag on a card: include it (an excluded one flips to included); already included stays. */
export function includeTag(f: ProjectFilters, tag: string): ProjectFilters {
  const k = fold(tag);
  const excludeTags = f.excludeTags.filter((t) => fold(t) !== k);
  return tagState(f, tag) === "include" ? f : { ...f, tags: [...f.tags, tag], excludeTags };
}

/** Clicking the category on a card: that category ("" = the uncategorised bucket). */
export function categoryValue(category: string): string {
  return category.trim() === "" ? UNCATEGORISED : category.trim();
}

/**
 * The rail's tag badges: the first `limit` (facets come sorted by count) unless `showAll`; a tag that is
 * included or excluded is always shown, so an active filter never hides behind "Show all".
 */
export function visibleTags(tags: readonly Facet[], limit: number, showAll: boolean): { shown: Facet[]; hidden: number } {
  if (showAll || tags.length <= limit) return { shown: tags.slice(), hidden: 0 };
  const shown = tags.filter((t, i) => i < limit || t.selected || t.excluded);
  return { shown, hidden: tags.length - shown.length };
}

/** Filters to use so `project` is in the result: unchanged when it already is, else defaults widened to its status. */
export function revealFilters(projects: readonly ProjectView[], f: ProjectFilters, id: string): ProjectFilters | null {
  const p = projects.find((x) => x.id === id);
  if (!p) return null;
  if (filterProjects([p], f).length === 1) return f;
  const d = defaultFilters();
  return d.statuses.includes(p.status) ? d : { ...d, statuses: [...d.statuses, p.status] };
}

// ---- stored view state (localStorage) ----

export interface ViewState { filters: ProjectFilters; sort: SortKey }

export const VIEW_STATE_KEY = "projects.view.v1";

const MAX_LIST = 50;

function strings(x: unknown, maxLen: number): string[] {
  if (!Array.isArray(x)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of x) {
    if (typeof v !== "string") continue;
    const s = v.trim();
    if (!s || s.length > maxLen || seen.has(fold(s))) continue;
    seen.add(fold(s));
    out.push(s);
    if (out.length >= MAX_LIST) break;
  }
  return out;
}

/** Whatever was stored, as a usable state. Never throws; anything unrecognised becomes the default. */
export function healViewState(raw: unknown): ViewState {
  const d = defaultFilters();
  const o = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const fr = typeof o.filters === "object" && o.filters !== null ? (o.filters as Record<string, unknown>) : {};
  const sort = SORT_OPTIONS.some((s) => s.value === o.sort) ? (o.sort as SortKey) : DEFAULT_SORT;
  const category = fr.category === UNCATEGORISED ? UNCATEGORISED
    : typeof fr.category === "string" && fr.category.trim() !== "" && fr.category.length <= PROJECT_LIMITS.category ? fr.category.trim()
    : null;
  const tags = strings(fr.tags, PROJECT_LIMITS.tag);
  const included = new Set(tags.map(fold));
  const statuses = Array.isArray(fr.statuses)
    ? PROJECT_STATUSES.filter((s) => (fr.statuses as unknown[]).includes(s))
    : d.statuses;
  return {
    sort,
    filters: {
      query: typeof fr.query === "string" ? fr.query.slice(0, 200) : "",
      category,
      tags,
      excludeTags: strings(fr.excludeTags, PROJECT_LIMITS.tag).filter((t) => !included.has(fold(t))),
      statuses: statuses as ProjectStatus[],
      stack: strings(fr.stack, PROJECT_LIMITS.stackId),
    },
  };
}
