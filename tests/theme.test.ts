import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { THEMES, WINDOW_BG, isThemeId, resolveMode, type ThemeId } from "../shared/theme";
import { contrastRatio } from "../renderer/theme/color";

const TOKENS = [
  "bg", "surface", "surface-raised", "text", "text-muted", "line", "accent", "accent-text", "accent-ink",
  "danger", "danger-ink", "success",
] as const;
const MODES = ["light", "dark"] as const;

type Palette = Record<(typeof TOKENS)[number], string>;

function parse(theme: ThemeId, mode: (typeof MODES)[number]): Record<string, string> {
  const css = readFileSync(resolve(__dirname, `../renderer/theme/themes/${theme}.css`), "utf8");
  const sel = `\\[data-theme="${theme}"\\]\\[data-mode="${mode}"\\]`;   // `:root[...][...], [...][...] {`: root and any element
  const block = new RegExp(`:root${sel},\\s*${sel}\\s*\\{([^}]*)\\}`).exec(css);
  if (!block) throw new Error(`no ${theme} ${mode} block`);
  return Object.fromEntries([...block[1].matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));
}

describe.each(THEMES.map((t) => t.id))("%s", (theme) => {
  describe.each(MODES)("%s", (mode) => {
    const p = parse(theme, mode) as Palette;
    const ratio = (fg: keyof Palette, bg: keyof Palette) => contrastRatio(p[fg], p[bg]);

    it("defines every base token and nothing else", () => {
      expect(Object.keys(p).sort()).toEqual([...TOKENS].sort());
    });
    it("window background matches --bg", () => {
      expect(WINDOW_BG[theme][mode].toLowerCase()).toBe(p.bg.toLowerCase());
    });
    it.each(["surface", "surface-raised", "bg"] as const)("text and muted text pass AA on %s", (bg) => {
      expect(ratio("text", bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio("text-muted", bg)).toBeGreaterThanOrEqual(4.5);
    });
    it("ink passes AA on accent and danger", () => {
      expect(ratio("accent-ink", "accent")).toBeGreaterThanOrEqual(4.5);
      expect(ratio("danger-ink", "danger")).toBeGreaterThanOrEqual(4.5);
    });
    it.each(["surface", "surface-raised"] as const)("accent text, danger and success pass AA on %s", (bg) => {
      for (const fg of ["accent-text", "danger", "success"] as const) expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
    it("accent line (focus ring, selection bar) is visible on surface and bg (3:1)", () => {
      expect(ratio("accent-text", "surface")).toBeGreaterThanOrEqual(3);
      expect(ratio("accent-text", "bg")).toBeGreaterThanOrEqual(3);
    });
    it("control border (text-muted) is visible on surface and bg (3:1)", () => {
      expect(ratio("text-muted", "surface")).toBeGreaterThanOrEqual(3);
      expect(ratio("text-muted", "bg")).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("theme helpers", () => {
  it("knows the theme ids", () => {
    expect(isThemeId("kraft")).toBe(true);
    expect(isThemeId("neon")).toBe(false);
  });
  it("resolves the mode", () => {
    expect(resolveMode("system", true)).toBe("dark");
    expect(resolveMode("system", false)).toBe("light");
    expect(resolveMode("light", true)).toBe("light");
  });
});
