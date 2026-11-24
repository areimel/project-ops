import { describe, expect, it } from "vitest";
import { joinIds } from "../renderer/components/common/fieldModel";

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
