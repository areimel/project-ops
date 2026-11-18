// Search, filter, sort and facet logic for the project list. Pure: no React, no DOM.
import { PROJECT_STATUSES, type ProjectStatus } from "../../../shared/projects/record";
import type { ProjectView } from "../../../shared/projects/view";

/** Category filter value for projects whose category is empty. */
export const UNCATEGORISED = "\u0000uncategorised";

export interface ProjectFilters {
  query: string;
  category: string | null; // null = all; UNCATEGORISED = empty category
  tags: string[]; // a project must have all of them
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
}

export interface Facets {
  categories: Facet[];
  tags: Facet[];
  statuses: Facet[];
  stack: Facet[];
  total: number;
}

export function defaultFilters(): ProjectFilters {
  return { query: "", category: null, tags: [], statuses: ["active", "paused"], stack: [] };
}

export const clearFilters = defaultFilters;

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

export function isFiltered(f: ProjectFilters): boolean {
  const d = defaultFilters();
  return (
    f.query.trim() !== "" || f.category !== null || f.tags.length > 0 || f.stack.length > 0 ||
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

export function matchesQuery(p: ProjectView, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = fold(
    [p.name, p.description ?? "", p.category, ...p.tags, ...p.stack, p.branch ?? "", p.folder].join("\n"),
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

// ---- facets ----

interface Entry { value: string; label: string }

/** Count one group over the projects passing every other filter; selected values stay even at 0. */
function buildFacet(
  projects: readonly ProjectView[],
  filters: ProjectFilters,
  group: Group,
  entriesOf: (p: ProjectView) => Entry[],
  selected: readonly string[],
  extra: Entry[] = [],
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
    if (!passes(p, filters, group)) continue;
    const seen = new Set<string>();
    for (const e of entriesOf(p)) {
      const k = fold(e.value);
      if (seen.has(k)) continue;
      seen.add(k);
      map.get(k)!.count += 1;
    }
  }
  for (const s of selected) if (!map.has(fold(s))) add({ value: s, label: s }, 0);
  return [...map.values()]
    .filter((f) => f.count > 0 || f.selected)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

const STATUS_LABELS: Record<ProjectStatus, string> = { active: "Active", paused: "Paused", archived: "Archived" };

export function facets(projects: readonly ProjectView[], filters: ProjectFilters): Facets {
  const catSelected = filters.category === null ? [] : [filters.category];
  const categories = buildFacet(
    projects, filters, "category",
    (p) => (categoryKey(p) === UNCATEGORISED ? [{ value: UNCATEGORISED, label: "Uncategorised" }] : [{ value: p.category.trim(), label: p.category.trim() }]),
    catSelected,
  ).map((f) => (f.value === UNCATEGORISED ? { ...f, label: "Uncategorised" } : f));
  const tags = buildFacet(projects, filters, "tags", (p) => p.tags.map((t) => ({ value: t, label: t })), filters.tags);
  const stack = buildFacet(projects, filters, "stack", (p) => p.stack.map((s) => ({ value: s, label: s })), filters.stack);
  const statuses: Facet[] = PROJECT_STATUSES.map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
    count: projects.filter((p) => p.status === s && passes(p, filters, "statuses")).length,
    selected: filters.statuses.includes(s),
  }));
  return { categories, tags, statuses, stack, total: filterProjects(projects, filters).length };
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

const DAY = 86_400_000;

/** "today", "3 days ago", "2 weeks ago", ... for card meta; locale-independent. */
export function relativeTime(ms: number | null, now: number): string {
  if (ms === null) return "never";
  const days = Math.floor((now - ms) / DAY);
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return plural(days, "day");
  if (days < 30) return plural(Math.floor(days / 7), "week");
  if (days < 365) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}
