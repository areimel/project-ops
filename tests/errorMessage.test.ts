import { describe, expect, it } from "vitest";
import { errorMessage } from "../renderer/utils/errorMessage";

describe("errorMessage", () => {
  it("reads an Error's message", () => expect(errorMessage(new Error("nope"))).toBe("nope"));
  it("stringifies anything else", () => {
    expect(errorMessage("plain")).toBe("plain");
    expect(errorMessage(42)).toBe("42");
  });
});
