import { describe, expect, it } from "vitest";
import { addTags, decideKey, filterSuggestions, normalizeTag, removeAt, type KeyState } from "../renderer/components/common/tagInputModel";

describe("normalizeTag", () => {
  it("trims, collapses whitespace and cuts", () => {
    expect(normalizeTag("  big   data \n")).toBe("big data");
    expect(normalizeTag("abcdef", 3)).toBe("abc");
    expect(normalizeTag("ab  def", 3)).toBe("ab");
    expect(normalizeTag("   ")).toBe("");
  });
});

describe("addTags", () => {
  it("adds several from comma or newline text", () => {
    expect(addTags([], "a, b ,c\nd")).toEqual(["a", "b", "c", "d"]);
  });
  it("dedupes ignoring case, keeping the first spelling", () => {
    expect(addTags(["React"], "react, Vue, VUE, ")).toEqual(["React", "Vue"]);
  });
  it("skips empties and never mutates", () => {
    const cur = ["a"];
    expect(addTags(cur, ",, ,")).toEqual(["a"]);
    addTags(cur, "b");
    expect(cur).toEqual(["a"]);
  });
  it("respects max and maxLength", () => {
    expect(addTags(["a"], "b, c, d", { max: 3 })).toEqual(["a", "b", "c"]);
    expect(addTags([], "abcdefgh", { maxLength: 4 })).toEqual(["abcd"]);
    expect(addTags(["a", "b"], "c", { max: 2 })).toEqual(["a", "b"]);
  });
});

describe("removeAt", () => {
  it("removes one index and ignores out-of-range", () => {
    expect(removeAt(["a", "b", "c"], 1)).toEqual(["a", "c"]);
    expect(removeAt(["a"], 5)).toEqual(["a"]);
    expect(removeAt(["a"], -1)).toEqual(["a"]);
  });
});

describe("filterSuggestions", () => {
  const all = ["Node", "node", "Rust", "Electron", "Nodemon", "Python"];
  it("matches substrings, prefix first, deduped, minus chosen", () => {
    expect(filterSuggestions(all, ["rust"], "ON")).toEqual(["Electron", "Nodemon", "Python"]);
    expect(filterSuggestions(all, [], "no")).toEqual(["Node", "Nodemon"]);
  });
  it("lists everything when nothing is typed, capped", () => {
    expect(filterSuggestions(all, [], "", 2)).toEqual(["Node", "Rust"]);
  });
  it("returns nothing when nothing matches", () => {
    expect(filterSuggestions(all, [], "zzz")).toEqual([]);
  });
});

describe("decideKey", () => {
  const base: KeyState = { key: "", input: "", open: false, active: -1, count: 0, tagCount: 0 };
  const k = (o: Partial<KeyState>) => decideKey({ ...base, ...o });
  it("Enter adds typed text, does nothing on empty", () => {
    expect(k({ key: "Enter", input: "go" })).toEqual({ type: "add" });
    expect(k({ key: "Enter", input: "  " })).toEqual({ type: "none" });
  });
  it("Enter picks the highlighted suggestion", () => {
    expect(k({ key: "Enter", input: "g", open: true, count: 3, active: 1 })).toEqual({ type: "pick", index: 1 });
    expect(k({ key: "Enter", input: "g", open: true, count: 3, active: -1 })).toEqual({ type: "add" });
    expect(k({ key: "Enter", input: "g", open: false, count: 3, active: 1 })).toEqual({ type: "add" });
  });
  it("comma adds", () => expect(k({ key: ",", input: "x" })).toEqual({ type: "add" }));
  it("Backspace removes the last tag only on empty input", () => {
    expect(k({ key: "Backspace", tagCount: 2 })).toEqual({ type: "removeLast" });
    expect(k({ key: "Backspace", tagCount: 2, input: "a" })).toEqual({ type: "none" });
    expect(k({ key: "Backspace", tagCount: 0 })).toEqual({ type: "none" });
  });
  it("arrows move with wrap and open the list", () => {
    expect(k({ key: "ArrowDown", count: 3 })).toEqual({ type: "move", to: 0 });
    expect(k({ key: "ArrowDown", count: 3, open: true, active: 2 })).toEqual({ type: "move", to: 0 });
    expect(k({ key: "ArrowDown", count: 3, open: true, active: 0 })).toEqual({ type: "move", to: 1 });
    expect(k({ key: "ArrowUp", count: 3, open: true, active: 0 })).toEqual({ type: "move", to: 2 });
    expect(k({ key: "ArrowUp", count: 3, open: true, active: -1 })).toEqual({ type: "move", to: 2 });
    expect(k({ key: "ArrowUp", count: 3 })).toEqual({ type: "none" });
    expect(k({ key: "ArrowDown", count: 0 })).toEqual({ type: "none" });
  });
  it("Escape closes only an open list", () => {
    expect(k({ key: "Escape", open: true, count: 2 })).toEqual({ type: "close" });
    expect(k({ key: "Escape" })).toEqual({ type: "none" });
  });
  it("ignores keys while composing", () => {
    expect(k({ key: "Enter", input: "x", composing: true })).toEqual({ type: "none" });
  });
});
