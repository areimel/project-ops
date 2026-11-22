// Search, filter, sort and facet logic for the project list. Pure: no React, no DOM.
import { PROJECT_STATUSES, type ProjectStatus } from "../../../shared/projects/record";
import type { ProjectView } from "../../../shared/projects/view";
import { plural } from "../../utils/plural";

/** Category filter value for projects whose category is empty. */
export const UNCATEGORISED = "\u0000uncategorised";

export interface ProjectFilters {
  query: string;
  category: string | null; // null = all; UNCATEGORISED = empty category
  tags: string[]; // a project must have all of them
  excludeTags: string[]; // a project must have none of them
  statuses: ProjectStatus[]; // empty = all
  stack: string[]; // a project must have at least one of them
}

export type SortKey = "name" | "lastCommit" | "added" | "updated";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "lastCommit", label: "Last commit" },
  { value: "added", label: "Date added" },
  { value: "updated", label: "Last edited" },
];

export const DEFAULT_SORT: SortKey = "lastCommit";

export interface Facet {
  value: string;
  label: string;
  count: number;
  selected: boolean;
  /** Tags only: the value is in `excludeTags` ("must not have"). */
  excluded?: boolean;
}

export interface Facets {
  categories: Facet[];
  tags: Facet[];
  statuses: Facet[];
  stack: Facet[];
  total: number;
  /** Does any project carry a tag (whatever the filters), so the rail can tell "no tags yet" from "none match". */
  tagsExist: boolean;
}

export function defaultFilters(): ProjectFilters {
  return { query: "", category: null, tags: [], excludeTags: [], statuses: ["active", "paused"], stack: [] };
}

export const clearFilters = defaultFilters;

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

export function isFiltered(f: ProjectFilters): boolean {
  const d = defaultFilters();
  return (
    f.query.trim() !== "" || f.category !== null || f.tags.length > 0 || f.excludeTags.length > 0 || f.stack.length > 0 ||
    !sameSet(f.statuses, d.statuses)
  );
}

/** Lowercase and strip accents, so "Café" matches "cafe". */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Add the value, or remove it if present (case-insensitive); the list is not mutated. */
export function toggle<T extends string>(list: readonly T[], value: T): T[] {
  const key = fold(value);
  return list.some((x) => fold(x) === key) ? list.filter((x) => fold(x) !== key) : [...list, value];
}

/**
 * True when every word of the query appears (case and accent insensitive) in one of the searched fields:
 * name, description, category, tags, stack, branch, folder, and the site's client, hosting and services.
 * The site's notes are not searched.
 */
export function matchesQuery(p: ProjectView, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = fold(
    [
      p.name, p.description ?? "", p.category, ...p.tags, ...p.stack, p.branch ?? "", p.folder,
      p.site.client, p.site.hosting, ...p.site.services,
    ].join("\n"),
  );
  return words.every((w) => hay.includes(w));
}

const categoryKey = (p: ProjectView) => (p.category.trim() === "" ? UNCATEGORISED : fold(p.category.trim()));

type Group = "category" | "tags" | "statuses" | "stack";

/** The filter test, optionally leaving one group out (for facet counts). */
function passes(p: ProjectView, f: ProjectFilters, skip?: Group): boolean {
  if (!matchesQuery(p, f.query)) return false;
  if (skip !== "category" && f.category !== null) {
    const want = f.category === UNCATEGORISED ? UNCATEGORISED : fold(f.category.trim());
    if (categoryKey(p) !== want) return false;
  }
  if (skip !== "tags" && f.tags.length > 0) {
    const have = p.tags.map(fold);
    if (!f.tags.every((t) => have.includes(fold(t)))) return false;
  }
  if (skip !== "tags" && f.excludeTags.length > 0) {
    const have = p.tags.map(fold);
    if (f.excludeTags.some((t) => have.includes(fold(t)))) return false;
  }
  if (skip !== "statuses" && f.statuses.length > 0 && !f.statuses.includes(p.status)) return false;
  if (skip !== "stack" && f.stack.length > 0) {
    const have = p.stack.map(fold);
    if (!f.stack.some((s) => have.includes(fold(s)))) return false;
  }
  return true;
}

export function filterProjects(projects: readonly ProjectView[], filters: ProjectFilters): ProjectView[] {
  return projects.filter((p) => passes(p, filters));
}

const byName = (a: ProjectView, b: ProjectView) =>
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }) ||
  (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Pinned first, then the chosen order; ties fall back to name then id. Returns a new array. */
export function sortProjects(projects: readonly ProjectView[], key: SortKey): ProjectView[] {
  const newestFirst = (x: number | null, y: number | null) => {
    if (x === y) return 0;
    if (x === null) return 1; // null last
    if (y === null) return -1;
    return y - x;
  };
  return projects.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    let d = 0;
    if (key === "name") d = 0;
    else if (key === "lastCommit") d = newestFirst(a.lastCommitAt, b.lastCommitAt);
    else if (key === "added") d = newestFirst(a.createdAt, b.createdAt);
    else d = newestFirst(a.updatedAt, b.updatedAt);
    return d || byName(a, b);
  });
}

/**
 * Where the unpinned cards start in a sorted result, when the result has both pinned and unpinned cards
 * (the grid then splits into two labelled groups); 0 when there is nothing to split.
 */
export function pinnedSplit(sorted: readonly ProjectView[]): number {
  const i = sorted.findIndex((p) => !p.pinned);
  return i > 0 ? i : 0;
}

// ---- facets ----

interface Entry { value: string; label: string }

/**
 * Count one group; selected values stay even at 0. By default a value counts the projects passing every
 * filter except this group's own ("what would clicking it give"). `countsFor` replaces that test per value key.
 */
function buildFacet(
  projects: readonly ProjectView[],
  filters: ProjectFilters,
  group: Group,
  entriesOf: (p: ProjectView) => Entry[],
  selected: readonly string[],
  extra: Entry[] = [],
  countsFor?: (p: ProjectView, key: string) => boolean,
): Facet[] {
  const map = new Map<string, Facet>();
  const sel = new Set(selected.map(fold));
  const add = (e: Entry, n: number) => {
    const k = fold(e.value);
    const cur = map.get(k);
    if (cur) cur.count += n;
    else map.set(k, { value: e.value, label: e.label, count: n, selected: sel.has(k) });
  };
  for (const p of projects) {
    for (const e of entriesOf(p)) add(e, 0); // register spelling from every project
  }
  for (const e of extra) add(e, 0);
  for (const p of projects) {
    const base = countsFor ? true : passes(p, filters, group);
    if (!base) continue;
    const seen = new Set<string>();
    for (const e of entriesOf(p)) {
      const k = fold(e.value);
      if (seen.has(k) || (countsFor && !countsFor(p, k))) continue;
      seen.add(k);
      map.get(k)!.count += 1;
    }
  }
  for (const s of selected) if (!map.has(fold(s))) add({ value: s, label: s }, 0);
  return [...map.values()]
    .filter((f) => f.count > 0 || f.selected)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

export const STATUS_LABELS: Record<ProjectStatus, string> = { active: "Active", paused: "Paused", archived: "Archived" };

export function facets(projects: readonly ProjectView[], filters: ProjectFilters): Facets {
  const catSelected = filters.category === null ? [] : [filters.category];
  const categories = buildFacet(
    projects, filters, "category",
    (p) => (categoryKey(p) === UNCATEGORISED ? [{ value: UNCATEGORISED, label: "Uncategorised" }] : [{ value: p.category.trim(), label: p.category.trim() }]),
    catSelected,
  ).map((f) => (f.value === UNCATEGORISED ? { ...f, label: "Uncategorised" } : f));
  const excluded = new Set(filters.excludeTags.map(fold));
  // Included tags are AND filters, so a tag's count is the size of the result if it were added (the projects
  // that pass every filter and carry it). An included tag therefore shows the whole result; an excluded tag
  // shows how many projects its own exclusion is hiding.
  const tagCount = (p: ProjectView, key: string) =>
    excluded.has(key)
      ? passes(p, { ...filters, excludeTags: filters.excludeTags.filter((t) => fold(t) !== key) })
      : passes(p, filters);
  const tags = buildFacet(
    projects, filters, "tags", (p) => p.tags.map((t) => ({ value: t, label: t })), [...filters.tags, ...filters.excludeTags], [], tagCount,
  ).map((t) => (excluded.has(fold(t.value)) ? { ...t, selected: false, excluded: true } : t));
  const stack = buildFacet(projects, filters, "stack", (p) => p.stack.map((s) => ({ value: s, label: s })), filters.stack);
  const statuses: Facet[] = PROJECT_STATUSES.map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
    count: projects.filter((p) => p.status === s && passes(p, filters, "statuses")).length,
    selected: filters.statuses.includes(s),
  }));
  return { categories, tags, statuses, stack, total: filterProjects(projects, filters).length, tagsExist: projects.some((p) => p.tags.length > 0) };
}

/** Distinct existing values for autocomplete: first-seen spelling, sorted. */
function distinct(values: Iterable<string>): string[] {
  const map = new Map<string, string>();
  for (const v of values) {
    const t = v.trim();
    if (t && !map.has(fold(t))) map.set(fold(t), t);
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export const allTags = (projects: readonly ProjectView[]): string[] => distinct(projects.flatMap((p) => p.tags));
export const allCategories = (projects: readonly ProjectView[]): string[] => distinct(projects.map((p) => p.category));
export const allHosting = (projects: readonly ProjectView[]): string[] => distinct(projects.map((p) => p.site.hosting));
export const allServices = (projects: readonly ProjectView[]): string[] => distinct(projects.flatMap((p) => p.site.services));

const DAY = 86_400_000;

/** "today", "3 days ago", "2 weeks ago", ... for card meta; locale-independent. */
export function relativeTime(ms: number | null, now: number): string {
  if (ms === null) return "never";
  const days = Math.floor((now - ms) / DAY);
  const ago = (n: number, one: string, many: string) => `${plural(n, one, many)} ago`;
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return ago(days, "day", "days");
  if (days < 30) return ago(Math.floor(days / 7), "week", "weeks");
  if (days < 365) return ago(Math.floor(days / 30), "month", "months");
  return ago(Math.floor(days / 365), "year", "years");
}
