import { describe, expect, it } from "vitest";
import {
  draftFrom, draftInvalid, draftPatch, emptyDraft, groupLinks, knownGroups, pinnedTiles, recentTiles, urlProblem,
} from "../../renderer/apps/dashboard/dashboardModel";
import type { ProjectView } from "../../shared/projects/view";
import type { ResourceLinkView } from "../../shared/resources/links";

let n = 0;
function project(o: Partial<ProjectView> = {}): ProjectView {
  n += 1;
  return {
    id: String(n).padStart(16, "0"), createdAt: n, updatedAt: n, name: `Project ${n}`, description: null,
    category: "", tags: [], status: "active", pinned: false, missing: false, origin: "scan", links: {} as ProjectView["links"],
    folder: `~/code/p${n}`, branch: null, lastCommitAt: null, dirty: null, stack: [], scannedAt: null, lastOpenedAt: null,
    overrides: { name: null, description: null, links: {} as ProjectView["links"] },
    detected: { name: `Project ${n}`, description: null, repo: null },
    ...o,
  };
}
const link = (name: string, group = "", url = `https://${name.toLowerCase()}.test/`): ResourceLinkView =>
  ({ id: name.padEnd(16, "0").slice(0, 16), name, url, group });
const names = (list: { name: string }[]) => list.map((x) => x.name);

describe("tiles", () => {
  it("pinned: every pinned project by name, missing ones included", () => {
    const ps = [project({ name: "zeta", pinned: true }), project({ name: "Alpha", pinned: true, missing: true }), project({ name: "beta" })];
    expect(names(pinnedTiles(ps))).toEqual(["Alpha", "zeta"]);
  });

  it("recent: newest open first, without never-opened, pinned or missing projects, capped", () => {
    const ps = [
      project({ name: "old", lastOpenedAt: 10 }), project({ name: "new", lastOpenedAt: 30 }), project({ name: "never" }),
      project({ name: "pinned", lastOpenedAt: 40, pinned: true }), project({ name: "gone", lastOpenedAt: 50, missing: true }),
      project({ name: "mid", lastOpenedAt: 20 }),
    ];
    expect(names(recentTiles(ps))).toEqual(["new", "mid", "old"]);
    expect(names(recentTiles(ps, 2))).toEqual(["new", "mid"]);
    expect(recentTiles([])).toEqual([]);
  });
});

describe("groupLinks", () => {
  it("puts ungrouped first, then groups and names in order, merging groups that differ by case", () => {
    const groups = groupLinks([
      link("Vercel", "Hosting"), link("Porkbun", "Domains"), link("GitHub"), link("netlify", "hosting"), link("Asana"),
    ]);
    expect(groups.map((g) => [g.group, names(g.links)])).toEqual([
      ["", ["Asana", "GitHub"]], ["Domains", ["Porkbun"]], ["Hosting", ["netlify", "Vercel"]],
    ]);
    expect(knownGroups([link("a", "Hosting"), link("b"), link("c", "Domains")])).toEqual(["Domains", "Hosting"]);
    expect(groupLinks([])).toEqual([]);
  });
});

describe("link draft", () => {
  it("is invalid without a name or with a missing or non-https address", () => {
    expect(draftInvalid(emptyDraft())).toBe(true);
    expect(draftInvalid({ name: "A", url: "", group: "" })).toBe(true);
    expect(draftInvalid({ name: "  ", url: "https://x.test", group: "" })).toBe(true);
    expect(draftInvalid({ name: "A", url: "http://x.test", group: "" })).toBe(true);
    expect(draftInvalid({ name: "A", url: "https://x.test", group: "" })).toBe(false);
  });

  it("only complains about an address once something is typed", () => {
    expect(urlProblem("  ")).toBeNull();
    expect(urlProblem("https://x.test")).toBeNull();
    expect(urlProblem("x.test")).toBe("Use a full https:// address.");
    expect(urlProblem("https://me:pw@x.test")).toBe("Use a full https:// address.");
  });

  it("a new link sends every field, cleaned", () => {
    expect(draftPatch({ name: "  Net  lify ", url: " https://App.netlify.com ", group: " Hosting " }))
      .toEqual({ name: "Net lify", url: "https://app.netlify.com/", group: "Hosting" });
  });

  it("an edit sends only what changed, or null", () => {
    const original = link("Netlify", "Hosting", "https://app.netlify.com/");
    expect(draftPatch(draftFrom(original), original)).toBeNull();
    expect(draftPatch({ ...draftFrom(original), url: "https://app.netlify.com" }, original)).toBeNull();
    expect(draftPatch({ ...draftFrom(original), group: "" }, original)).toEqual({ group: "" });
    expect(draftPatch({ name: "N", url: "https://n.test", group: "Hosting" }, original)).toEqual({ name: "N", url: "https://n.test/" });
  });
});
