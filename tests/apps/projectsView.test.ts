import { describe, expect, it } from "vitest";
import {
  capList, cardCategory, cardMuted, cardStatus, gitInfo, splitFolder, stackLabel, traitRows,
} from "../../renderer/apps/projects/cardModel";
import {
  VIEW_STATE_KEY, activeFilters, categoryValue, cycleTag, healViewState, includeTag, revealFilters, tagState, visibleTags,
} from "../../renderer/apps/projects/filterState";
import { UNCATEGORISED, defaultFilters, pinnedSplit, type Facet, type ProjectFilters } from "../../renderer/apps/projects/projectsModel";
import type { ProjectView } from "../../shared/projects/view";

let n = 0;
function project(o: Partial<ProjectView> = {}): ProjectView {
  n += 1;
  return {
    id: String(n).padStart(16, "0"), createdAt: n, updatedAt: n, name: `Project ${n}`, description: null,
    category: "", tags: [], status: "active", pinned: false, missing: false, origin: "scan",
    links: { repo: null, site: null, docs: null }, folder: `~/code/p${n}`, branch: null, lastCommitAt: null, dirty: null,
    stack: [], scannedAt: null, lastOpenedAt: null, overrides: { name: null, description: null, links: { repo: null, site: null, docs: null } },
    detected: { name: `Project ${n}`, description: null, repo: null }, ...o,
  };
}
const f = (o: Partial<ProjectFilters> = {}): ProjectFilters => ({ ...defaultFilters(), ...o });

describe("tag cycle", () => {
  it("goes off -> include -> exclude -> off, case-insensitively", () => {
    const a = cycleTag(f(), "CLI");
    expect([a.tags, a.excludeTags, tagState(a, "cli")]).toEqual([["CLI"], [], "include"]);
    const b = cycleTag(a, "cli");
    expect([b.tags, b.excludeTags, tagState(b, "CLI")]).toEqual([[], ["cli"], "exclude"]);
    const c = cycleTag(b, "Cli");
    expect([c.tags, c.excludeTags, tagState(c, "cli")]).toEqual([[], [], "off"]);
  });
  it("leaves other tags alone", () => {
    expect(cycleTag(f({ tags: ["web"], excludeTags: ["tui"] }), "cli")).toMatchObject({ tags: ["web", "cli"], excludeTags: ["tui"] });
  });
  it("a card's tag includes it, flipping an exclusion, and is idempotent", () => {
    expect(includeTag(f({ excludeTags: ["TUI"] }), "tui")).toMatchObject({ tags: ["tui"], excludeTags: [] });
    const on = f({ tags: ["cli"] });
    expect(includeTag(on, "CLI")).toBe(on);
  });
  it("a card's empty category is the uncategorised bucket", () => {
    expect(categoryValue("  ")).toBe(UNCATEGORISED);
    expect(categoryValue(" Work ")).toBe("Work");
  });
});

describe("visibleTags", () => {
  const tags: Facet[] = Array.from({ length: 25 }, (_, i) => ({ value: `t${i}`, label: `t${i}`, count: 25 - i, selected: false }));
  it("caps the list but keeps active tags", () => {
    expect(visibleTags(tags, 20, false)).toMatchObject({ hidden: 5 });
    const withActive = tags.map((t, i) => (i === 23 ? { ...t, excluded: true } : i === 24 ? { ...t, selected: true } : t));
    const r = visibleTags(withActive, 20, false);
    expect(r.shown.map((t) => t.value).slice(-2)).toEqual(["t23", "t24"]);
    expect(r.hidden).toBe(3);
  });
  it("shows everything when asked or short", () => {
    expect(visibleTags(tags, 20, true)).toMatchObject({ hidden: 0 });
    expect(visibleTags(tags.slice(0, 5), 20, false).shown).toHaveLength(5);
  });
});

describe("revealFilters", () => {
  const work = project({ category: "Work" });
  const old = project({ status: "archived" });
  const all = [work, old];
  it("keeps filters that already show it", () => {
    const cur = f({ category: "work" });
    expect(revealFilters(all, cur, work.id)).toBe(cur);
  });
  it("falls back to defaults, widened to the project's status", () => {
    expect(revealFilters(all, f({ category: "Home" }), work.id)).toEqual(defaultFilters());
    expect(revealFilters(all, f(), old.id)?.statuses).toEqual(["active", "paused", "archived"]);
  });
  it("is null for an unknown id", () => {
    expect(revealFilters(all, f(), "ffffffffffffffff")).toBeNull();
  });
});

describe("healViewState", () => {
  it("has a versioned key", () => expect(VIEW_STATE_KEY).toMatch(/v1$/));
  it("gives defaults for junk", () => {
    for (const raw of [null, 3, "x", [], { filters: 5, sort: "nope" }]) {
      expect(healViewState(raw)).toEqual({ filters: defaultFilters(), sort: "lastCommit" });
    }
  });
  it("keeps valid values and drops bad ones", () => {
    const r = healViewState({
      sort: "name",
      filters: {
        query: "cli", category: " Work ", tags: ["CLI", "cli", 4, "", "x".repeat(99)], excludeTags: ["tui", "CLI"],
        statuses: ["archived", "bogus"], stack: ["rust"],
      },
    });
    expect(r).toEqual({
      sort: "name",
      filters: { query: "cli", category: "Work", tags: ["CLI"], excludeTags: ["tui"], statuses: ["archived"], stack: ["rust"] },
    });
  });
  it("round-trips the uncategorised bucket and an empty status list", () => {
    const s = { sort: "added", filters: { ...defaultFilters(), category: UNCATEGORISED, statuses: [] } };
    expect(healViewState(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});

describe("card model", () => {
  it("trait rows leave out what is empty", () => {
    expect(traitRows(project())).toEqual(["git", "folder"]);
    expect(traitRows(project({ branch: "main", stack: ["rust"], links: { repo: "https://x.test/", site: null, docs: null } })))
      .toEqual(["branch", "lastCommit", "stack", "folder", "links"]);
    expect(traitRows(project({ branch: null, lastCommitAt: 5 }))).toEqual(["branch", "lastCommit", "folder"]);
  });
  it("names the category or the bucket", () => {
    expect(cardCategory({ category: "" })).toBe("Uncategorised");
    expect(cardCategory({ category: " Work" })).toBe("Work");
  });
  it("status: missing outranks the stored status", () => {
    expect(cardStatus({ status: "active", missing: false })).toEqual({ tone: "accent", label: "Active" });
    expect(cardStatus({ status: "paused", missing: false })).toEqual({ tone: "muted", label: "Paused" });
    expect(cardStatus({ status: "archived", missing: false })).toEqual({ tone: "muted", label: "Archived" });
    expect(cardStatus({ status: "active", missing: true })).toEqual({ tone: "danger", label: "Folder missing" });
    expect([cardMuted({ status: "active", missing: false }), cardMuted({ status: "archived", missing: false }), cardMuted({ status: "paused", missing: true })])
      .toEqual([false, true, true]);
  });
  it("caps a list, never hiding just one", () => {
    expect(capList([1, 2, 3], 2)).toEqual({ shown: [1, 2, 3], more: 0 });
    expect(capList([1, 2, 3, 4], 2)).toEqual({ shown: [1, 2], more: 2 });
    expect(capList([], 2)).toEqual({ shown: [], more: 0 });
  });
  it("labels stack ids", () => {
    expect([stackLabel("c-cpp"), stackLabel("typescript"), stackLabel("zig")]).toEqual(["C/C++", "TypeScript", "zig"]);
  });
  it("decides what the git rows say", () => {
    expect(gitInfo({ branch: null, lastCommitAt: null })).toBe("none");
    expect(gitInfo({ branch: "main", lastCommitAt: null })).toBe("unread");
    expect(gitInfo({ branch: "main", lastCommitAt: 5 })).toBe("read");
    expect(gitInfo({ branch: null, lastCommitAt: 5 })).toBe("read");
  });
  it("splits a folder so the last segment can stay visible", () => {
    expect(splitFolder("~/code/projects/app")).toEqual({ head: "~/code/projects/", tail: "app" });
    expect(splitFolder("C:\\Users\\me\\app")).toEqual({ head: "C:\\Users\\me\\", tail: "app" });
    expect(splitFolder("app")).toEqual({ head: "", tail: "app" });
    expect(splitFolder("~/code/")).toEqual({ head: "", tail: "~/code/" });
  });
});

describe("activeFilters", () => {
  it("is empty for the defaults and ignores the search text", () => {
    expect(activeFilters(f({ query: "cli" }))).toEqual([]);
  });
  it("lists each filter in rail order with a label", () => {
    const chips = activeFilters(f({ category: UNCATEGORISED, tags: ["cli"], excludeTags: ["tui"], statuses: [], stack: ["rust"] }));
    expect(chips.map((c) => c.label)).toEqual(["Uncategorised", "Tag: cli", "Not: tui", "Status: all", "Stack: Rust"]);
    expect(activeFilters(f({ statuses: ["archived", "active"] })).map((c) => c.label)).toEqual(["Status: Active, Archived"]);
  });
  it("removing a chip takes off only that filter", () => {
    const on = f({ category: "Work", tags: ["cli", "web"], excludeTags: ["tui"], statuses: ["archived"], stack: ["rust"] });
    const [cat, cli, , not, status, stack] = activeFilters(on);
    expect(cat.remove(on).category).toBeNull();
    expect(cli.remove(on).tags).toEqual(["web"]);
    expect(not.remove(on).excludeTags).toEqual([]);
    expect(status.remove(on).statuses).toEqual(defaultFilters().statuses);
    expect(stack.remove(on).stack).toEqual([]);
    expect(activeFilters(activeFilters(on).reduce((g, c) => c.remove(g), on))).toEqual([]);
  });
});

describe("pinnedSplit", () => {
  it("splits only when both groups exist", () => {
    expect(pinnedSplit([])).toBe(0);
    expect(pinnedSplit([project(), project()])).toBe(0);
    expect(pinnedSplit([project({ pinned: true }), project({ pinned: true })])).toBe(0);
    expect(pinnedSplit([project({ pinned: true }), project({ pinned: true }), project()])).toBe(2);
  });
});
