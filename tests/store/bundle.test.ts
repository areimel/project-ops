import { describe, expect, it } from "vitest";
import { applyCollections, buildBundle, clearCollections, exportCollections, healBundle } from "../../electron/store/bundle";
import { createCollection } from "../../electron/store/collectionCore";
import { brand } from "../../shared/brand";
import { projectSpec, rootSpec } from "../../shared/projects";
import { defaultSettings } from "../../shared/settings";

const stores = () => ({ projects: createCollection(projectSpec), "project-roots": createCollection(rootSpec) });
const wrap = (collections: unknown, extra: object = {}) => ({ format: brand.packageName, version: 1, collections, ...extra });

describe("bundle", () => {
  it("round-trips projects and roots through JSON into fresh collections", () => {
    const a = stores();
    const root = a["project-roots"].create({ path: "/home/x/code" });
    const p = a.projects.create({ path: "/home/x/code/app", rootId: root.id, favorite: true });
    const hidden = a.projects.create({ path: "/home/x/code/old", rootId: root.id });
    a.projects.update(hidden.id, { hidden: true });
    const settings = { ...defaultSettings(), mode: "dark" as const };

    const json = JSON.stringify(buildBundle(settings, exportCollections(a), new Date("2026-11-17T10:00:00Z")));
    const bundle = healBundle(JSON.parse(json));
    expect(bundle?.exportedAt).toBe("2026-11-17T10:00:00.000Z");
    expect(bundle?.settings).toEqual(settings);
    expect(Object.keys(bundle?.collections ?? {}).sort()).toEqual(["project-roots", "projects"]);

    const b = stores();
    const counts = applyCollections(bundle!, b);
    expect(counts).toEqual({ projects: 2, "project-roots": 1 });
    expect(b.projects.list()).toEqual(a.projects.list());
    expect(b["project-roots"].list()).toEqual(a["project-roots"].list());
    expect(b.projects.get(p.id)?.path).toBe("/home/x/code/app");
  });

  it("a partial file replaces only the collections it contains", () => {
    const a = stores();
    a.projects.create({ path: "/a" });
    const root = a["project-roots"].create({ path: "/r" });
    const bundle = healBundle(wrap({ projects: [{ path: "/b" }, { path: "/c" }] }));
    expect(Object.keys(bundle?.collections ?? {})).toEqual(["projects"]);
    expect(applyCollections(bundle!, a)).toEqual({ projects: 2 });
    expect(a.projects.list().map((r) => r.path)).toEqual(["/b", "/c"]);
    expect(a["project-roots"].list().map((r) => r.id)).toEqual([root.id]);
  });

  it("garbage records are dropped and counted after healing", () => {
    const bundle = healBundle(wrap({ projects: [{ path: "/ok" }, 5, null, "x", {}, { path: "" }], "project-roots": "no" }));
    const s = stores();
    expect(applyCollections(bundle!, s)).toEqual({ projects: 1 });
    expect(s.projects.list().map((r) => r.path)).toEqual(["/ok"]);
  });

  it("ignores unknown collections and refuses other formats", () => {
    expect(healBundle(wrap({ notes: [1], evil: [1], constructor: [1] }))?.collections).toEqual({});
    for (const raw of [undefined, null, 5, [], {}, wrap({}, { format: "other-app" }), wrap({}, { version: 2 }), wrap({}, { version: "1" })]) {
      expect(healBundle(raw), JSON.stringify(raw)).toBeNull();
    }
  });

  it("a newer-version collection refuses the whole import before anything is replaced", () => {
    const s = stores();
    s.projects.create({ path: "/keep" });
    const newer = createCollection(rootSpec, { read: () => ({ version: 99, items: [] }) });
    const bundle = healBundle(wrap({ projects: [{ path: "/new" }], "project-roots": [{ path: "/r" }] }));
    expect(() => applyCollections(bundle!, { projects: s.projects, "project-roots": newer })).toThrow(/newer version/);
    expect(s.projects.list().map((r) => r.path)).toEqual(["/keep"]);
  });

  it("an empty list in the file empties that collection; reset clears all", () => {
    const s = stores();
    s.projects.create({ path: "/a" });
    s["project-roots"].create({ path: "/r" });
    expect(applyCollections(healBundle(wrap({ projects: [] }))!, s)).toEqual({ projects: 0 });
    expect(s["project-roots"].list()).toHaveLength(1);
    clearCollections(s);
    expect(s["project-roots"].list()).toEqual([]);
  });
});
