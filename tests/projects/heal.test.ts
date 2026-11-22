import { describe, expect, it } from "vitest";
import {
  applyProjectPatch, healLink, healProject, healProjectPatch, healRoot, projectSpec, rootSpec,
  emptySite, healSite, toProjectView, toProjectViews, toRootView, type ProjectRecord,
} from "../../shared/projects";

const garbage = [undefined, null, 0, 1, "x", true, [], [1], () => 1];
const PATH = "/home/someone/code_projects/desktop-app-projects/project-ops";
const display = (abs: string) => abs.replace("/home/someone", "~").replace(/^~\/.*\/([^/]+\/[^/]+)$/, "~/…/$1");

function record(fields: Record<string, unknown> = {}): ProjectRecord {
  const healed = healProject({ path: PATH, ...fields });
  if (!healed) throw new Error("fixture did not heal");
  return { ...healed, id: "0123456789abcdef", createdAt: 1, updatedAt: 2 };
}

describe("healLink", () => {
  it("keeps https URLs, normalised", () => {
    expect(healLink("  https://github.com/a/b  ")).toBe("https://github.com/a/b");
    expect(healLink("https://Example.com")).toBe("https://example.com/");
  });
  it("refuses everything else", () => {
    for (const x of [
      "http://example.com", "javascript:alert(1)", "file:///etc/passwd", "ftp://x.org", "data:text/html,hi",
      "https://user:pw@example.com", "https://user@example.com", "example.com", "", "   ", "https://", 5, null,
      `https://example.com/${"a".repeat(2100)}`,
    ]) expect(healLink(x), String(x)).toBeNull();
  });
});

describe("project heal", () => {
  it("never throws; non-objects and records without an absolute path are unusable", () => {
    for (const g of garbage) expect(projectSpec.heal(g)).toBeNull();
    for (const path of [undefined, "", "relative/dir", "~/x", "./x", 7, "/a\0b", `/${"a".repeat(5000)}`]) {
      expect(healProject({ path }), String(path)).toBeNull();
    }
    expect(healProject({ path: "C:\\Users\\me\\proj" })?.path).toBe("C:\\Users\\me\\proj");
  });

  it("refuses network (UNC) paths in every spelling", () => {
    for (const path of ["\\\\server\\share\\p", "//server/share/p", "\\/server/share", "/\\server\\share", "\\\\?\\C:\\p", "\\\\.\\pipe\\x"]) {
      expect(healProject({ path }), path).toBeNull();
      expect(healRoot({ path }), path).toBeNull();
    }
    expect(healProject({ path: "C:/Users/me/proj" })?.path).toBe("C:/Users/me/proj");
    expect(healRoot({ path: "/home/x" })).toEqual({ path: "/home/x" });
  });

  it("fills defaults and drops unknown keys", () => {
    expect(healProject({ path: PATH, id: "x", extra: 1 })).toEqual({
      path: PATH, origin: "manual", rootId: null, missing: false, hidden: false, name: null, description: null,
      category: "", tags: [], status: "active", pinned: false, site: emptySite(), links: { repo: null, site: null, docs: null }, lastOpenedAt: null,
      scan: { name: null, description: null, repoUrl: null, branch: null, lastCommitAt: null, dirty: null, stack: [], scannedAt: null },
    });
  });

  it("trims, collapses whitespace and truncates text", () => {
    const p = healProject({
      path: PATH, name: "  My \n  project  ", description: "d".repeat(600), category: ` ${"c".repeat(60)} `,
    });
    expect(p?.name).toBe("My project");
    expect(p?.description).toHaveLength(500);
    expect(p?.category).toHaveLength(48);
    expect(healProject({ path: PATH, name: "   ", description: "" })).toMatchObject({ name: null, description: null });
  });

  it("dedupes tags case-insensitively, keeps the first spelling, caps count and length", () => {
    const p = healProject({ path: PATH, tags: [" CLI ", "cli", "Desktop   app", 4, "", "t".repeat(40)] });
    expect(p?.tags).toEqual(["CLI", "Desktop app", "t".repeat(32)]);
    const many = healProject({ path: PATH, tags: Array.from({ length: 30 }, (_, i) => `tag${i}`) });
    expect(many?.tags).toHaveLength(20);
  });

  it("status, origin and rootId fall back", () => {
    expect(healProject({ path: PATH, status: "done", origin: "x", rootId: "nope" }))
      .toMatchObject({ status: "active", origin: "manual", rootId: null });
    expect(healProject({ path: PATH, status: "archived", origin: "scan", rootId: "00000000000000ff" }))
      .toMatchObject({ status: "archived", origin: "scan", rootId: "00000000000000ff" });
  });

  it("links are https only", () => {
    const p = healProject({ path: PATH, links: { repo: "http://x.org", site: "https://x.org/", docs: "javascript:1", other: "https://y" } });
    expect(p?.links).toEqual({ repo: null, site: "https://x.org/", docs: null });
  });

  it("heals the nested scan", () => {
    const p = healProject({
      path: PATH,
      scan: { name: " Pkg ", description: 3, repoUrl: "git@github.com:a/b.git", branch: "main", lastCommitAt: -1,
        dirty: "yes", stack: ["node", "Node", "rust"], scannedAt: 10, junk: true },
    });
    expect(p?.scan).toEqual({
      name: "Pkg", description: null, repoUrl: null, branch: "main", lastCommitAt: null, dirty: null,
      stack: ["node", "rust"], scannedAt: 10,
    });
    expect(healProject({ path: PATH, scan: "x" })?.scan.stack).toEqual([]);
  });
});

describe("healProjectPatch", () => {
  it("is empty for garbage", () => {
    for (const g of garbage) expect(healProjectPatch(g)).toEqual({});
  });

  it("drops main-only and unknown keys", () => {
    const p = healProjectPatch({
      path: "/etc", hidden: false, origin: "scan", rootId: "0123456789abcdef", missing: false,
      scan: { name: "x" }, id: "0123456789abcdef", createdAt: 1, other: 1, pinned: true,
    });
    expect(p).toEqual({ pinned: true });
  });

  it("the page cannot set lastOpenedAt; a stored one heals as a timestamp", () => {
    expect(healProjectPatch({ lastOpenedAt: 5, pinned: true })).toEqual({ pinned: true });
    expect(healProject({ path: PATH, lastOpenedAt: 1234 })?.lastOpenedAt).toBe(1234);
    expect(healProject({ path: PATH, lastOpenedAt: "soon" })?.lastOpenedAt).toBeNull();
  });

  it("keeps valid user fields, drops invalid ones", () => {
    expect(healProjectPatch({
      name: "  New  name ", description: "", category: " Work ", tags: ["a", "A", "b"], status: "paused",
    })).toEqual({ name: "New name", description: null, category: "Work", tags: ["a", "b"], status: "paused" });
    expect(healProjectPatch({ name: 5, description: {}, category: null, tags: "a", status: "x", pinned: "y" })).toEqual({});
    expect(healProjectPatch({ name: null })).toEqual({ name: null });
  });

  it("links: valid kept, cleared with null or empty, invalid dropped from the patch", () => {
    expect(healProjectPatch({ links: { repo: "https://a.org", site: "", docs: "http://b.org" } }))
      .toEqual({ links: { repo: "https://a.org/", site: null } });
    expect(healProjectPatch({ links: { docs: null } })).toEqual({ links: { docs: null } });
    expect(healProjectPatch({ links: { repo: "javascript:1" } })).toEqual({});
    expect(healProjectPatch({ links: "https://a.org" })).toEqual({});
  });

  it("applyProjectPatch merges links key by key and keeps main fields", () => {
    const current = record({ links: { repo: "https://r.org", docs: "https://d.org" }, hidden: true });
    const next = applyProjectPatch(current, healProjectPatch({ links: { site: "https://s.org" }, pinned: true, path: "/x" }));
    expect(next.links).toEqual({ repo: "https://r.org/", site: "https://s.org/", docs: "https://d.org/" });
    expect(next).toMatchObject({ path: PATH, hidden: true, pinned: true });
  });
});

describe("site details", () => {
  it("healSite defaults on garbage and heals key by key", () => {
    for (const g of garbage) expect(healSite(g)).toEqual(emptySite());
    expect(healSite({ client: " Acme\n Co ", hosting: 5, launchDate: "2026-02-30", services: ["SEO", "seo", 3, " Care "], notes: "a\r\nb\u0000" }))
      .toEqual({ client: "Acme Co", hosting: "", launchDate: null, services: ["SEO", "Care"], notes: "a\nb" });
    expect(healSite({ launchDate: "2026-03-01" }).launchDate).toBe("2026-03-01");
  });

  it("an old record without site heals to empty", () => {
    expect(healProject({ path: PATH })?.site).toEqual(emptySite());
    expect(record({ site: { client: "X" } }).site.client).toBe("X");
  });

  it("healProjectPatch site: valid kept, invalid dropped, launchDate clears", () => {
    expect(healProjectPatch({ site: { client: " A ", hosting: "Netlify", launchDate: "2026-05-06", services: ["a", "a"], notes: "n" } }))
      .toEqual({ site: { client: "A", hosting: "Netlify", launchDate: "2026-05-06", services: ["a"], notes: "n" } });
    expect(healProjectPatch({ site: { launchDate: null } })).toEqual({ site: { launchDate: null } });
    expect(healProjectPatch({ site: { launchDate: "  " } })).toEqual({ site: { launchDate: null } });
    expect(healProjectPatch({ site: { launchDate: "2026-13-01" } })).toEqual({});
    expect(healProjectPatch({ site: { client: 1, services: "x", notes: null } })).toEqual({});
    expect(healProjectPatch({ site: "x" })).toEqual({});
  });

  it("applyProjectPatch merges site key by key", () => {
    const current = record({ site: { client: "A", hosting: "H", notes: "keep" } });
    const next = applyProjectPatch(current, healProjectPatch({ site: { client: "B" } }));
    expect(next.site).toEqual({ client: "B", hosting: "H", launchDate: null, services: [], notes: "keep" });
  });

  it("toProjectView copies site", () => {
    const r = record({ site: { services: ["a"] } });
    const v = toProjectView(r, display);
    expect(v.site).toEqual(r.site);
    expect(v.site.services).not.toBe(r.site.services);
  });
});

describe("toProjectView", () => {
  const deepStrings = (x: unknown): string[] =>
    typeof x === "string" ? [x] : x && typeof x === "object" ? Object.values(x).flatMap(deepStrings) : [];

  it("override ?? detected ?? folder name", () => {
    expect(toProjectView(record(), display).name).toBe("project-ops");
    const scanned = record({ scan: { name: "Detected", description: "From manifest", repoUrl: "https://github.com/a/b" } });
    expect(toProjectView(scanned, display)).toMatchObject({
      name: "Detected", description: "From manifest", links: { repo: "https://github.com/a/b" },
      overrides: { name: null, description: null }, detected: { name: "Detected", repo: "https://github.com/a/b" },
    });
    const edited = record({ name: "Mine", description: "My words", links: { repo: "https://gitlab.com/x" }, scan: { name: "Detected", repoUrl: "https://github.com/a/b" } });
    expect(toProjectView(edited, display)).toMatchObject({
      name: "Mine", description: "My words", links: { repo: "https://gitlab.com/x" },
      overrides: { name: "Mine", description: "My words" }, detected: { name: "Detected" },
    });
  });

  it("never exposes the path", () => {
    const view = toProjectView(record({ scan: { name: "x", branch: "main", stack: ["node"] }, tags: ["a"] }), display);
    expect(view).not.toHaveProperty("path");
    expect(view.folder).toBe("~/…/desktop-app-projects/project-ops");
    for (const s of deepStrings(view)) {
      expect(s.includes(PATH), s).toBe(false);
      expect(/^(\/|[A-Za-z]:[\\/])/.test(s), s).toBe(false);
    }
  });

  it("toProjectViews leaves hidden records out", () => {
    const views = toProjectViews([record(), { ...record({ hidden: true }), id: "00000000000000aa" }], display);
    expect(views.map((v) => v.id)).toEqual(["0123456789abcdef"]);
  });
});

describe("roots", () => {
  it("heal needs an absolute path and keeps only it", () => {
    for (const g of garbage) expect(rootSpec.heal(g)).toBeNull();
    expect(healRoot({ path: "rel" })).toBeNull();
    expect(healRoot({ path: "/home/x", other: 1 })).toEqual({ path: "/home/x" });
  });

  it("the view shows display text only", () => {
    const view = toRootView({ id: "0123456789abcdef", createdAt: 1, updatedAt: 1, path: "/home/someone/code" }, display, 3);
    expect(view).toEqual({ id: "0123456789abcdef", folder: "~/code", projectCount: 3 });
  });
});
