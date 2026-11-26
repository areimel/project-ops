import { describe, expect, it } from "vitest";
import { joinIds, saveStep } from "../renderer/components/common/fieldModel";

describe("joinIds", () => {
  it("returns undefined when there is nothing to join", () => {
    expect(joinIds()).toBeUndefined();
    expect(joinIds(undefined, null, false, "")).toBeUndefined();
  });
  it("joins the ids that are set, in order", () => {
    expect(joinIds("a", undefined, "b")).toBe("a b");
  });
  it("splits lists, trims spaces and drops repeats", () => {
    expect(joinIds("a  b", "b", " c ")).toBe("a b c");
  });
});

describe("saveStep", () => {
  it("ignores a save while the form is invalid or already saving, without building a patch", () => {
    let built = 0;
    expect(saveStep(true, () => { built += 1; return { a: 1 }; })).toEqual({ kind: "ignore" });
    expect(built).toBe(0);
  });
  it("closes when nothing changed", () => {
    expect(saveStep(false, () => null)).toEqual({ kind: "close" });
  });
  it("saves the patch otherwise", () => {
    expect(saveStep(false, () => ({ name: "Atlas" }))).toEqual({ kind: "save", patch: { name: "Atlas" } });
  });
});
