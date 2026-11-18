import { describe, expect, it } from "vitest";
import type { Note } from "../../shared/collections/notes";
import { displayTitle, draftPatch, filterNotes, noteCount, shortDate, sortNotes } from "../../renderer/apps/notes/notesModel";

const note = (o: Partial<Note>): Note => ({ id: "0000000000000000", createdAt: 0, updatedAt: 0, title: "", body: "", pinned: false, ...o });

describe("displayTitle", () => {
  it("prefers the title", () => expect(displayTitle(note({ title: " Plan ", body: "x" }))).toBe("Plan"));
  it("falls back to the first non-empty body line", () => expect(displayTitle(note({ body: "\n\n  Hello\nmore" }))).toBe("Hello"));
  it("cuts a long first line", () => expect(displayTitle(note({ body: "a".repeat(200) }))).toHaveLength(80));
  it("names an empty note", () => expect(displayTitle(note({ body: " \n " }))).toBe("Untitled note"));
});

describe("sortNotes", () => {
  it("puts pinned first, then newest first, without changing the input", () => {
    const a = note({ id: "a", updatedAt: 1 });
    const b = note({ id: "b", updatedAt: 3 });
    const c = note({ id: "c", updatedAt: 2, pinned: true });
    const input = [a, b, c];
    expect(sortNotes(input).map((n) => n.id)).toEqual(["c", "b", "a"]);
    expect(input.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });
});

describe("filterNotes", () => {
  const list = [note({ id: "a", title: "Groceries", body: "milk and eggs" }), note({ id: "b", title: "Ideas", body: "Eggs benedict" })];
  it("returns everything for a blank query", () => expect(filterNotes(list, "  ")).toHaveLength(2));
  it("matches title or body, ignoring case", () => expect(filterNotes(list, "EGGS").map((n) => n.id)).toEqual(["a", "b"]));
  it("requires every word, in any order", () => expect(filterNotes(list, "eggs milk").map((n) => n.id)).toEqual(["a"]));
  it("returns nothing when no note matches", () => expect(filterNotes(list, "zebra")).toEqual([]));
});

describe("draftPatch", () => {
  const n = note({ title: "T", body: "B" });
  it("is null when nothing changed", () => expect(draftPatch(n, { title: "T", body: "B" })).toBeNull());
  it("holds only the changed fields", () => {
    expect(draftPatch(n, { title: "T", body: "B2" })).toEqual({ body: "B2" });
    expect(draftPatch(n, { title: "", body: "B" })).toEqual({ title: "" });
  });
});

describe("labels", () => {
  it("pluralises the count", () => {
    expect(noteCount(1)).toBe("1 note");
    expect(noteCount(0)).toBe("0 notes");
    expect(noteCount(12)).toBe("12 notes");
  });
  it("shows a date for another day", () => {
    const now = new Date(2026, 10, 17, 12).getTime();
    expect(shortDate(new Date(2026, 10, 3, 9).getTime(), now)).not.toBe(shortDate(now, now));
    expect(shortDate(now, now)).toMatch(/\d/);
  });
});
