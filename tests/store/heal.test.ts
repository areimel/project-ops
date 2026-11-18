import { describe, expect, it } from "vitest";
import { COLLECTIONS } from "../../shared/collections";
import { isoDate } from "../../shared/collections/heal";
import { notes } from "../../shared/collections/notes";
import { snippets } from "../../shared/collections/snippets";
import { tasks } from "../../shared/collections/tasks";

const garbage = [undefined, null, 0, 1, "x", true, [], [1], () => 1];

describe("collection heal", () => {
  it("never throws, and non-objects are unusable", () => {
    for (const spec of Object.values(COLLECTIONS)) for (const g of garbage) expect(spec.heal(g)).toBeNull();
  });

  it("notes: defaults, trims to limits, drops unknown keys", () => {
    expect(notes.heal({})).toEqual({ title: "", body: "", pinned: false });
    const n = notes.heal({ title: "t".repeat(300), body: "b".repeat(100_001), pinned: "yes", id: "x", other: 1 });
    expect(n).toEqual({ title: "t".repeat(200), body: "b".repeat(100_000), pinned: false });
  });

  it("tasks: needs a title, validates the due date", () => {
    expect(tasks.heal({})).toBeNull();
    expect(tasks.heal({ title: "   " })).toBeNull();
    expect(tasks.heal({ title: "a", due: "2026-02-30" })).toEqual({ title: "a", done: false, due: null });
    expect(tasks.heal({ title: "a", due: "2026-02-28", done: true })).toEqual({ title: "a", done: true, due: "2026-02-28" });
    expect(tasks.heal({ title: "x".repeat(600) })?.title).toHaveLength(500);
  });

  it("snippets: needs text, label optional", () => {
    expect(snippets.heal({ label: "l" })).toBeNull();
    expect(snippets.heal({ text: "hi" })).toEqual({ label: "", text: "hi" });
    expect(snippets.heal({ label: "l".repeat(200), text: "t".repeat(20_001) })).toEqual({ label: "l".repeat(100), text: "t".repeat(20_000) });
  });

  it("isoDate accepts only real calendar dates", () => {
    expect(isoDate("2024-02-29")).toBe("2024-02-29");
    for (const x of ["2025-02-29", "2025-1-1", "2025-13-01", 20250101, null, "2025-01-01T00:00"]) expect(isoDate(x)).toBeNull();
  });
});
