import { describe, expect, it } from "vitest";
import {
  allCategories, allTags, clearFilters, defaultFilters, facets, filterProjects, isFiltered, matchesQuery,
  relativeTime, SORT_OPTIONS, sortProjects, toggle, UNCATEGORISED, type ProjectFilters,
} from "../../renderer/apps/projects/projectsModel";
import type { ProjectView } from "../../shared/projects/view";

let n = 0;
function project(o: Partial<ProjectView> = {}): ProjectView {
  n += 1;
  return {
    id: String(n).padStart(16, "0"), createdAt: n, updatedAt: n, name: `Project ${n}`, description: null,
    category: "", tags: [], status: "active", pinned: false, missing: false, origin: "scan", links: {} as ProjectView["links"],
    folder: `~/code/p${n}`, branch: null, lastCommitAt: null, dirty: null, stack: [], scannedAt: null,
    overrides: { name: null, description: null, links: {} as ProjectView["links"] },
    detected: { name: `Project ${n}`, description: null, repo: null },
    ...o,
  };
}
const f = (o: Partial<ProjectFilters> = {}): ProjectFilters => ({ ...defaultFilters(), ...o });
const names = (ps: ProjectView[]) => ps.map((p) => p.name);

describe("defaults", () => {
  it("hides archived and is not 'filtered'", () => {
    expect(defaultFilters()).toEqual({ query: "", category: null, tags: [], excludeTags: [], statuses: ["active", "paused"], stack: [] });
    expect(isFiltered(defaultFilters())).toBe(false);
    expect(isFiltered(f({ statuses: ["paused", "active"] }))).toBe(false);
    expect(clearFilters()).toEqual(defaultFilters());
    expect(SORT_OPTIONS.map((o) => o.value)).toEqual(["name", "lastCommit", "added", "updated"]);
  });
  it("detects any change", () => {
    for (const o of [{ query: "x" }, { category: "Work" }, { tags: ["a"] }, { excludeTags: ["a"] }, { stack: ["node"] }, { statuses: [] }, { statuses: ["archived" as const] }]) {
      expect(isFiltered(f(o))).toBe(true);
    }
  });
  it("hides archived projects by default and shows them when selected or all", () => {
    const ps = [project({ name: "A" }), project({ name: "B", status: "archived" }), project({ name: "C", status: "paused" })];
    expect(names(filterProjects(ps, defaultFilters()))).toEqual(["A", "C"]);
    expect(names(filterProjects(ps, f({ statuses: ["archived"] })))).toEqual(["B"]);
    expect(filterProjects(ps, f({ statuses: [] }))).toHaveLength(3);
  });
});

describe("query", () => {
  const p = project({ name: "Café Tool", description: "Terminal helper", category: "Work", tags: ["CLI"], stack: ["rust"], branch: "feature/x", folder: "~/code/zeta" });
  it("matches every word across any field, case and accent insensitive", () => {
    expect(matchesQuery(p, "")).toBe(true);
    expect(matchesQuery(p, "cafe")).toBe(true);
    expect(matchesQuery(p, "TERMINAL work")).toBe(true);
    expect(matchesQuery(p, "cli rust feature zeta")).toBe(true);
    expect(matchesQuery(p, "cafe missing")).toBe(false);
  });
  it("is part of filtering", () => {
    const other = project({ name: "Other" });
    expect(filterProjects([p, other], f({ query: "terminal" }))).toEqual([p]);
  });
});

describe("filters", () => {
  const a = project({ name: "A", category: "Work", tags: ["CLI", "TUI"], stack: ["rust"] });
  const b = project({ name: "B", category: "work", tags: ["cli"], stack: ["node"] });
  const c = project({ name: "C", category: "", tags: ["web"], stack: ["node", "react"] });
  const all = [a, b, c];
  it("category is exact and case-insensitive; uncategorised is a bucket", () => {
    expect(names(filterProjects(all, f({ category: "WORK" })))).toEqual(["A", "B"]);
    expect(names(filterProjects(all, f({ category: UNCATEGORISED })))).toEqual(["C"]);
    expect(filterProjects(all, f({ category: "Wor" }))).toEqual([]);
  });
  it("tags require all selected, case-insensitively", () => {
    expect(names(filterProjects(all, f({ tags: ["cli"] })))).toEqual(["A", "B"]);
    expect(names(filterProjects(all, f({ tags: ["CLI", "tui"] })))).toEqual(["A"]);
  });
  it("Work + terminal app + CLI but not TUI", () => {
    const x = project({ name: "X", category: "Work", tags: ["terminal app", "CLI"] });
    const y = project({ name: "Y", category: "Work", tags: ["terminal app", "CLI", "TUI"] });
    const z = project({ name: "Z", category: "Home", tags: ["terminal app", "CLI"] });
    expect(names(filterProjects([x, y, z], f({ category: "Work", tags: ["terminal app", "cli"] })))).toEqual(["X", "Y"]);
    expect(names(filterProjects([x, y, z], f({ category: "Work", tags: ["terminal app", "cli"], excludeTags: ["tui"] })))).toEqual(["X"]);
  });
  it("excluded tags drop any project carrying one, case-insensitively", () => {
    expect(names(filterProjects(all, f({ excludeTags: ["TUI"] })))).toEqual(["B", "C"]);
    expect(names(filterProjects(all, f({ excludeTags: ["tui", "web"] })))).toEqual(["B"]);
  });
  it("stack matches any selected id", () => {
    expect(names(filterProjects(all, f({ stack: ["rust", "react"] })))).toEqual(["A", "C"]);
  });
  it("combines with AND", () => {
    expect(names(filterProjects(all, f({ category: "work", stack: ["node"], tags: ["cli"] })))).toEqual(["B"]);
  });
});

describe("sortProjects", () => {
  it("name: numeric, base sensitivity, stable on ties by id", () => {
    const ps = [project({ name: "item 10" }), project({ name: "Item 2" }), project({ name: "item 2" })];
    const out = sortProjects(ps, "name");
    expect(names(out)).toEqual(["Item 2", "item 2", "item 10"]);
    expect(out[0].id < out[1].id).toBe(true);
  });
  it("pinned first in every key, returns a new array", () => {
    const ps = [project({ name: "A", lastCommitAt: 9 }), project({ name: "Z", pinned: true, lastCommitAt: 1 })];
    for (const k of ["name", "lastCommit", "added", "updated"] as const) expect(names(sortProjects(ps, k))[0]).toBe("Z");
    expect(sortProjects(ps, "name")).not.toBe(ps);
    expect(names(ps)).toEqual(["A", "Z"]);
  });
  it("lastCommit newest first with null last", () => {
    const ps = [project({ name: "N" }), project({ name: "Old", lastCommitAt: 1 }), project({ name: "New", lastCommitAt: 5 }), project({ name: "M" })];
    expect(names(sortProjects(ps, "lastCommit"))).toEqual(["New", "Old", "M", "N"]);
  });
  it("added and updated newest first", () => {
    const ps = [project({ name: "A", createdAt: 1, updatedAt: 9 }), project({ name: "B", createdAt: 5, updatedAt: 2 })];
    expect(names(sortProjects(ps, "added"))).toEqual(["B", "A"]);
    expect(names(sortProjects(ps, "updated"))).toEqual(["A", "B"]);
  });
});

describe("facets", () => {
  const ps = [
    project({ name: "A", category: "Work", tags: ["CLI", "TUI"], stack: ["rust"] }),
    project({ name: "B", category: "work", tags: ["cli"], stack: ["node"] }),
    project({ name: "C", category: "", tags: ["web"], stack: ["node"] }),
    project({ name: "D", category: "Home", tags: ["cli"], status: "archived" }),
  ];
  const get = (list: { value: string; count: number }[], v: string) => list.find((x) => x.value === v);
  it("counts with default filters, merging case and keeping first spelling", () => {
    const r = facets(ps, defaultFilters());
    expect(r.total).toBe(3);
    expect(r.categories.map((c) => [c.label, c.count])).toEqual([["Work", 2], ["Uncategorised", 1]]);
    expect(get(r.categories, UNCATEGORISED)?.count).toBe(1);
    expect(r.tags.map((t) => [t.label, t.count])).toEqual([["CLI", 2], ["TUI", 1], ["web", 1]]);
    expect(r.statuses.map((s) => [s.value, s.count, s.selected])).toEqual([["active", 3, true], ["paused", 0, true], ["archived", 1, false]]);
  });
  it("ignores its own group but respects the others", () => {
    const r = facets(ps, f({ category: "Work", tags: ["tui"] }));
    expect(r.total).toBe(1);
    // categories ignore the category filter but apply tags=tui
    expect(r.categories.map((c) => [c.label, c.count, c.selected])).toEqual([["Work", 1, true]]);
    // tags ignore the tags filter but apply category=Work
    expect(get(r.tags, "CLI")?.count).toBe(2);
    expect(get(r.tags, "TUI")).toMatchObject({ count: 1, selected: true });
    expect(get(r.tags, "web")).toBeUndefined();
  });
  it("keeps selected values at zero", () => {
    const r = facets(ps, f({ tags: ["web", "tui"] }));
    expect(r.total).toBe(0);
    expect(get(r.tags, "TUI")).toMatchObject({ count: 1, selected: true });
    const r2 = facets(ps, f({ category: "Nowhere", stack: ["go"] }));
    expect(get(r2.categories, "Nowhere")).toMatchObject({ count: 0, selected: true });
    expect(get(r2.stack, "go")).toMatchObject({ count: 0, selected: true });
  });
  it("marks excluded tags and counts them as if included, while other groups apply the exclusion", () => {
    const r = facets(ps, f({ excludeTags: ["tui"] }));
    expect(r.total).toBe(2);
    expect(get(r.tags, "TUI")).toMatchObject({ count: 1, selected: false, excluded: true });
    expect(get(r.tags, "CLI")).toMatchObject({ count: 2, selected: false });
    expect(r.tags.find((t) => t.value === "CLI")?.excluded).toBeUndefined();
    expect(get(r.stack, "rust")).toBeUndefined(); // A (rust) carries TUI
    const zero = facets(ps, f({ excludeTags: ["gone"] }));
    expect(get(zero.tags, "gone")).toMatchObject({ count: 0, excluded: true });
  });
  it("respects the query in every group", () => {
    const r = facets(ps, f({ query: "web" }));
    expect(r.tags.map((t) => t.value)).toEqual(["web"]);
  });
  it("sorts by count then label", () => {
    const r = facets(ps, defaultFilters());
    expect(r.stack.map((s) => s.value)).toEqual(["node", "rust"]);
  });
});

describe("autocomplete lists", () => {
  it("returns distinct first-seen spellings, sorted", () => {
    const ps = [project({ category: "work", tags: ["b", "A"] }), project({ category: "Work", tags: ["a", "C"] }), project({ category: "" })];
    expect(allTags(ps)).toEqual(["A", "b", "C"]);
    expect(allCategories(ps)).toEqual(["work"]);
  });
});

describe("toggle", () => {
  it("adds and removes case-insensitively without mutating", () => {
    const l = ["CLI"];
    expect(toggle(l, "tui")).toEqual(["CLI", "tui"]);
    expect(toggle(l, "cli")).toEqual([]);
    expect(l).toEqual(["CLI"]);
  });
});

describe("relativeTime", () => {
  const now = 1_000 * 86_400_000;
  const ago = (days: number) => relativeTime(now - days * 86_400_000, now);
  it("covers the boundaries", () => {
    expect(relativeTime(null, now)).toBe("never");
    expect(relativeTime(now + 5000, now)).toBe("today");
    expect(ago(0)).toBe("today");
    expect(ago(1)).toBe("yesterday");
    expect(ago(3)).toBe("3 days ago");
    expect(ago(6)).toBe("6 days ago");
    expect(ago(7)).toBe("1 week ago");
    expect(ago(14)).toBe("2 weeks ago");
    expect(ago(29)).toBe("4 weeks ago");
    expect(ago(30)).toBe("1 month ago");
    expect(ago(150)).toBe("5 months ago");
    expect(ago(364)).toBe("12 months ago");
    expect(ago(365)).toBe("1 year ago");
    expect(ago(800)).toBe("2 years ago");
  });
});
