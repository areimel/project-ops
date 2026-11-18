import { describe, expect, it } from "vitest";
import { boolOrNull, isoDate, line, oneOf, strList, timestamp } from "../../shared/collections/heal";
import { notes, tasks } from "./fixtures";

const garbage = [undefined, null, 0, 1, "x", true, [], [1], () => 1];

describe("collection heal", () => {
  it("never throws, and non-objects are unusable", () => {
    for (const spec of [notes, tasks]) for (const g of garbage) expect(spec.heal(g)).toBeNull();
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

  it("isoDate accepts only real calendar dates", () => {
    expect(isoDate("2024-02-29")).toBe("2024-02-29");
    for (const x of ["2025-02-29", "2025-1-1", "2025-13-01", 20250101, null, "2025-01-01T00:00"]) expect(isoDate(x)).toBeNull();
  });

  it("line trims, collapses inner whitespace and cuts", () => {
    expect(line("  a \n\t b  ", 10)).toBe("a b");
    expect(line("abcdef", 3)).toBe("abc");
    expect(line("ab cd", 3)).toBe("ab");
    expect(line(5, 3)).toBe("");
    expect(line(null, 3, "x")).toBe("x");
  });

  it("strList keeps strings, drops empties, dedupes case-insensitively and caps", () => {
    expect(strList([" Rust ", "rust", "RUST", "Go", "", "  ", 3, null, "Desktop  App"], 10, 20)).toEqual(["Rust", "Go", "Desktop App"]);
    expect(strList(["a", "b", "c"], 2, 5)).toEqual(["a", "b"]);
    expect(strList(["abcdef", "abcxyz"], 5, 3)).toEqual(["abc"]);
    for (const g of garbage) if (!Array.isArray(g)) expect(strList(g, 5, 5)).toEqual([]);
  });

  it("oneOf, timestamp and boolOrNull", () => {
    const values = ["a", "b"] as const;
    expect(oneOf("b", values, "a")).toBe("b");
    expect(oneOf("c", values, "a")).toBe("a");
    expect(oneOf(undefined, values, "a")).toBe("a");
    expect(timestamp(1700000000000)).toBe(1700000000000);
    for (const x of [-1, Number.NaN, Infinity, "1", null]) expect(timestamp(x)).toBeNull();
    expect(boolOrNull(false)).toBe(false);
    expect(boolOrNull("true")).toBeNull();
  });
});
