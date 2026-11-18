import { describe, expect, it } from "vitest";
import { contrastRatio, ensureContrast, hexToRgb, inkFor, isHex, luminance, mix, rgbToHex } from "../renderer/theme/color";

describe("hex parsing", () => {
  it("reads long and short forms", () => {
    expect(hexToRgb("#14315c")).toEqual([20, 49, 92]);
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
  });
  it("rejects anything else", () => {
    expect(isHex("red")).toBe(false);
    expect(isHex("#12345")).toBe(false);
    expect(isHex(null)).toBe(false);
    expect(() => hexToRgb("blue")).toThrow();
  });
  it("round-trips and clamps", () => {
    expect(rgbToHex([20, 49, 92])).toBe("#14315c");
    expect(rgbToHex([300, -4, 0.4])).toBe("#ff0000");
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for identical colours", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });
  it("is symmetric", () => {
    expect(contrastRatio("#14315c", "#fbfcfe")).toBeCloseTo(contrastRatio("#fbfcfe", "#14315c"), 10);
  });
  it("matches a known pair", () => {
    // #767676 on white is the classic 4.54:1 grey.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });
  it("orders luminance", () => {
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
    expect(luminance("#000000")).toBe(0);
  });
});

describe("inkFor", () => {
  it("picks white on dark and the dark ink on light", () => {
    expect(inkFor("#0f2a52")).toBe("#ffffff");
    expect(inkFor("#ffd166")).toBe("#10161f");
  });
  it("always reaches 4.5 on the accents the themes ship", () => {
    for (const c of ["#d1345b", "#2558c9", "#b5481f", "#7aa7ff", "#f0a35e"]) {
      expect(contrastRatio(c, inkFor(c))).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("mix and ensureContrast", () => {
  it("mixes linearly", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#102030", "#ffffff", 0)).toBe("#102030");
  });
  it("leaves a passing colour alone", () => {
    expect(ensureContrast("#14315c", "#fbfcfe", "#14315c")).toBe("#14315c");
  });
  it("darkens a pale accent toward the ink until it reads on the sheet", () => {
    const out = ensureContrast("#ff9aa8", "#fbfcfe", "#14315c");
    expect(contrastRatio(out, "#fbfcfe")).toBeGreaterThanOrEqual(4.5);
  });
});
