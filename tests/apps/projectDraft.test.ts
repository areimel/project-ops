import { describe, expect, it } from "vitest";
import { draftFromView, dateProblem, draftInvalid, draftPatch, linkProblem } from "../../renderer/apps/projects/projectDraft";
import type { ProjectView } from "../../shared/projects/view";

const none = { repo: null, site: null, docs: null };
const view = (o: Partial<ProjectView> = {}): ProjectView => ({
  id: "0123456789abcdef", createdAt: 1, updatedAt: 1, name: "Detected", description: "Found text", category: "Work",
  tags: ["CLI"], status: "active", pinned: false, missing: false, origin: "scan",
  site: { client: "", hosting: "", launchDate: null, services: [], notes: "" },
  links: { repo: "https://github.com/a/b", site: null, docs: null }, folder: "~/code/b", branch: "main", lastCommitAt: 1,
  dirty: false, stack: [], scannedAt: 1, lastOpenedAt: null, overrides: { name: null, description: null, links: none },
  detected: { name: "Detected", description: "Found text", repo: "https://github.com/a/b" }, ...o,
});

describe("draftFromView", () => {
  it("starts from the user's own values, not the detected ones", () => {
    const d = draftFromView(view({ overrides: { name: "Mine", description: null, links: { ...none, site: "https://x.dev/" } } }));
    expect(d).toEqual({
      name: "Mine", description: "", category: "Work", tags: ["CLI"], status: "active", pinned: false,
      links: { repo: "", site: "https://x.dev/", docs: "" },
      site: { client: "", hosting: "", launchDate: "", services: [], notes: "" },
    });
  });
});

describe("draftPatch", () => {
  it("is null when nothing changed, including whitespace-only edits", () => {
    const p = view();
    expect(draftPatch(p, draftFromView(p))).toBeNull();
    expect(draftPatch(p, { ...draftFromView(p), name: "   ", category: " Work " })).toBeNull();
  });
  it("sends only changed fields, with empty overrides as null", () => {
    const p = view({ overrides: { name: "Old", description: "Mine", links: { ...none, docs: "https://d.dev/" } } });
    const d = { ...draftFromView(p), name: "  New   name ", description: "", tags: ["CLI", "TUI"], pinned: true,
      links: { repo: "https://gitlab.com/x", site: "", docs: "" } };
    expect(draftPatch(p, d)).toEqual({
      name: "New name", description: null, tags: ["CLI", "TUI"], pinned: true,
      links: { repo: "https://gitlab.com/x", docs: null },
    });
  });
  it("changes status and category; reordered tags count as a change", () => {
    const p = view({ tags: ["a", "b"] });
    expect(draftPatch(p, { ...draftFromView(p), status: "archived", category: "", tags: ["b", "a"] }))
      .toEqual({ status: "archived", category: "", tags: ["b", "a"] });
  });
  it("leaves invalid links out and normalises valid ones", () => {
    const p = view();
    expect(draftPatch(p, { ...draftFromView(p), links: { repo: "http://x.dev", site: "https://X.dev", docs: "" } }))
      .toEqual({ links: { site: "https://x.dev/" } });
  });
});

describe("link checks", () => {
  it("accepts empty and https, refuses the rest", () => {
    expect(linkProblem("")).toBeNull();
    expect(linkProblem("  https://a.dev/x ")).toBeNull();
    expect(linkProblem("http://a.dev")).toMatch(/https/);
    expect(linkProblem("a.dev")).toMatch(/https/);
    expect(linkProblem("https://user:pw@a.dev")).toMatch(/https/);
    expect(linkProblem(`https://a.dev/${"x".repeat(3000)}`)).toMatch(/long/);
    const d = draftFromView(view());
    expect(draftInvalid(d)).toBe(false);
    expect(draftInvalid({ ...d, links: { ...d.links, docs: "ftp://x" } })).toBe(true);
  });
});

describe("site details", () => {
  const withSite = view({ site: { client: "Acme", hosting: "Netlify", launchDate: "2026-01-02", services: ["SEO"], notes: "hi" } });
  it("fills the draft from the view", () => {
    expect(draftFromView(withSite).site).toEqual({ client: "Acme", hosting: "Netlify", launchDate: "2026-01-02", services: ["SEO"], notes: "hi" });
  });
  it("sends no site key when unchanged", () => {
    expect(draftPatch(withSite, draftFromView(withSite))).toBeNull();
  });
  it("sends only changed keys, normalised", () => {
    const d = draftFromView(withSite);
    expect(draftPatch(withSite, { ...d, site: { ...d.site, client: "  Beta   Co " } })).toEqual({ site: { client: "Beta Co" } });
    expect(draftPatch(withSite, { ...d, site: { ...d.site, services: ["SEO", "Care"] } })).toEqual({ site: { services: ["SEO", "Care"] } });
    expect(draftPatch(withSite, { ...d, site: { ...d.site, notes: "a\r\nb" } })).toEqual({ site: { notes: "a\nb" } });
  });
  it("clears the launch date with null", () => {
    const d = draftFromView(withSite);
    expect(draftPatch(withSite, { ...d, site: { ...d.site, launchDate: "" } })).toEqual({ site: { launchDate: null } });
  });
  it("flags an invalid date and leaves it out of the patch", () => {
    const d = draftFromView(withSite);
    const bad = { ...d, site: { ...d.site, launchDate: "2026-02-31" } };
    expect(dateProblem("2026-02-31")).toBe("Use a full date.");
    expect(dateProblem("")).toBeNull();
    expect(dateProblem("2026-02-03")).toBeNull();
    expect(draftInvalid(bad)).toBe(true);
    expect(draftPatch(withSite, bad)).toBeNull();
  });
});
