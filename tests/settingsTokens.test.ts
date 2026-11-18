import { describe, expect, it } from "vitest";
import { accentIsHardToRead, normalizeHex } from "../renderer/settings/themeTokens";

describe("normalizeHex", () => {
  it("accepts six and three digits, with or without #, in any case", () => {
    expect(normalizeHex("#3366CC")).toBe("#3366cc");
    expect(normalizeHex(" 3366cc ")).toBe("#3366cc");
    expect(normalizeHex("#36c")).toBe("#3366cc");
  });
  it("rejects everything else", () => {
    for (const bad of ["", "#", "#12", "#12345", "#1234567", "#gggggg", "red", "#33 66cc"]) expect(normalizeHex(bad)).toBeNull();
  });
});

describe("accentIsHardToRead", () => {
  it("warns below 4.5:1 on the surface", () => {
    expect(accentIsHardToRead("#ffff00", "#ffffff")).toBe(true);
    expect(accentIsHardToRead("#0b3d91", "#ffffff")).toBe(false);
  });
  it("does not warn on values it cannot read", () => {
    expect(accentIsHardToRead("nope", "#ffffff")).toBe(false);
    expect(accentIsHardToRead("#ffff00", "")).toBe(false);
  });
});
