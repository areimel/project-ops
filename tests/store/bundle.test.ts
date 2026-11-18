import { describe, expect, it } from "vitest";
import { buildBundle, healBundle } from "../../electron/store/bundle";
import { createCollection } from "../../electron/store/collectionCore";
import { brand } from "../../shared/brand";
import { tasks } from "../../shared/collections/tasks";
import { notes } from "../../shared/collections/notes";
import { defaultSettings } from "../../shared/settings";

describe("bundle", () => {
  it("round-trips through JSON into fresh collections", () => {
    const n = createCollection(notes);
    const t = createCollection(tasks);
    n.create({ title: "Hello", body: "World", pinned: true });
    t.create({ title: "One", due: "2026-01-02" });
    t.create({ title: "Two", done: true });
    const settings = { ...defaultSettings(), theme: "kraft" as const, accent: "#112233" };

    const json = JSON.stringify(buildBundle(settings, { notes: n.list(), tasks: t.list(), snippets: [] }, new Date("2026-11-17T10:00:00Z")));
    const bundle = healBundle(JSON.parse(json));
    expect(bundle).not.toBeNull();
    expect(bundle?.format).toBe(brand.packageName);
    expect(bundle?.exportedAt).toBe("2026-11-17T10:00:00.000Z");
    expect(bundle?.settings).toEqual(settings);

    const n2 = createCollection(notes);
    const t2 = createCollection(tasks);
    n2.replaceAll(bundle?.collections.notes);
    t2.replaceAll(bundle?.collections.tasks);
    expect(n2.list()).toEqual(n.list());
    expect(t2.list()).toEqual(t.list());
  });

  it("rejects what is not a bundle of this app", () => {
    const ok = buildBundle(defaultSettings(), { notes: [], tasks: [], snippets: [] });
    expect(healBundle(ok)).not.toBeNull();
    for (const raw of [undefined, null, 5, "x", [], {}, { ...ok, format: "other-app" }, { ...ok, version: 2 }, { ...ok, version: "1" }, { ...ok, version: 0 }]) {
      expect(healBundle(raw), JSON.stringify(raw)).toBeNull();
    }
  });

  it("ignores unknown collections; a malformed body gives no collections and no settings", () => {
    const b = healBundle({ format: brand.packageName, version: 1, collections: { notes: "no", evil: [1], constructor: [1] }, settings: 7 });
    expect(b?.collections).toEqual({});
    expect(b?.settings).toEqual({});
    expect(b?.exportedAt).toBe("");
  });

  it("returns only the collections and settings the file contains, so a partial import leaves the rest alone", () => {
    const b = healBundle({ format: brand.packageName, version: 1, collections: { tasks: [{ title: "x" }] }, settings: { mode: "dark", theme: "nope" } });
    expect(Object.keys(b?.collections ?? {})).toEqual(["tasks"]);
    expect(b?.settings).toEqual({ mode: "dark" });
    const empty = healBundle({ format: brand.packageName, version: 1, collections: { notes: [] } });
    expect(empty?.collections).toEqual({ notes: [] });     // an empty list is present: it replaces
    expect(empty?.settings).toEqual({});
  });

  it("items inside a bundle are healed on import, not trusted", () => {
    const b = healBundle({ format: brand.packageName, version: 1, collections: { tasks: [{ title: "ok" }, { title: "" }, "x", { title: "y", done: "no" }] } });
    const t = createCollection(tasks);
    t.replaceAll(b?.collections.tasks);
    expect(t.list().map((r) => r.title)).toEqual(["ok", "y"]);
  });
});
