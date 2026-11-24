import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The styleguide is only a dependable reference while it is complete. These checks read the folders, never the
// TSX modules, so they need no DOM.
const root = resolve(__dirname, "..");
const COMMON = resolve(root, "renderer/components/common");
const STYLEGUIDE = resolve(root, "renderer/apps/styleguide");
const ENTRIES = resolve(STYLEGUIDE, "entries");

const names = (dir: string, ext: string) => readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length)).sort();
const read = (file: string) => readFileSync(file, "utf8");

function entryFiles(): string[] {
  return readdirSync(ENTRIES, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".tsx")).map((f) => resolve(ENTRIES, f));
}

describe("styleguide coverage", () => {
  const components = names(COMMON, ".tsx");
  const sheets = names(resolve(ENTRIES, "components"), ".tsx");

  it("has one sheet per common component, named after its file", () => {
    expect(sheets).toEqual(components);
  });

  it("each component sheet names its component file as the source", () => {
    for (const name of sheets) {
      expect(read(resolve(ENTRIES, "components", `${name}.tsx`)), name).toContain(`source: "renderer/components/common/${name}.tsx"`);
    }
  });

  it("every file under entries/ is an entry whose source file exists", () => {
    for (const file of entryFiles()) {
      const text = read(file);
      expect(text, file).toMatch(/export const entry = /);
      expect(text, file).toMatch(/satisfies CatalogueEntry;/);
      const source = /\bsource: "([^"]+)"/.exec(text)?.[1];
      expect(source, file).toBeTruthy();
      expect(() => read(resolve(root, source ?? "")), `${file}: ${source}`).not.toThrow();
    }
  });

  it("entry ids are unique", () => {
    const ids = entryFiles().map((f) => /\bid: "([^"]+)"/.exec(read(f))?.[1]);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("styleguide styles", () => {
  const sheets = names(STYLEGUIDE, ".css").map((n) => read(resolve(STYLEGUIDE, `${n}.css`)).replace(/\/\*[\s\S]*?\*\//g, ""));

  it("every class it defines starts with styleguide-", () => {
    for (const css of sheets) {
      // Selector text only: what stands before each rule's opening brace.
      const selectors = [...css.matchAll(/(^|[}{;])\s*([^{};@]+)\{/g)].map((m) => m[2]);
      for (const selector of selectors) {
        const first = /\.([a-zA-Z][\w-]*)/.exec(selector)?.[1];
        if (first) expect(first.startsWith("styleguide"), selector.trim()).toBe(true);
      }
    }
  });

  it("uses tokens, not raw colours", () => {
    for (const css of sheets) expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });
});
