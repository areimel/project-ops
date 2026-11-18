import { describe, expect, it } from "vitest";
import { HandleTable, decodeText, displayFolder, elideMiddle, isTextFileName, safeFileName } from "../../electron/features/filesCore";

const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);

describe("isTextFileName", () => {
  it("accepts .md .markdown .txt in any case and nothing else", () => {
    for (const n of ["a.md", "B.MARKDOWN", "c.txt", "x.y.Md"]) expect(isTextFileName(n)).toBe(true);
    for (const n of ["a.mp4", "md", "a.md.exe", "a.mdx", ""]) expect(isTextFileName(n)).toBe(false);
  });
});

describe("decodeText", () => {
  it("decodes UTF-8 and strips a BOM", () => {
    expect(decodeText(bytes("héllo\n"), 100)).toBe("héllo\n");
    expect(decodeText(new Uint8Array([0xef, 0xbb, 0xbf, 0x68, 0x69]), 100)).toBe("hi");
  });
  it("throws Too large over the limit", () => {
    expect(() => decodeText(bytes("x".repeat(11)), 10)).toThrow("Too large");
    expect(decodeText(bytes("x".repeat(10)), 10)).toHaveLength(10);
  });
  it("throws Not a text file for NUL bytes and invalid UTF-8", () => {
    expect(() => decodeText(new Uint8Array([0x68, 0, 0x69]), 100)).toThrow("Not a text file");
    expect(() => decodeText(new Uint8Array([0xff, 0xfe, 0x41]), 100)).toThrow("Not a text file");
  });
});

describe("displayFolder", () => {
  it("shortens the home directory to ~", () => {
    expect(displayFolder("/home/al/docs/a.md", "/home/al")).toBe("~/docs");
    expect(displayFolder("/home/al/a.md", "/home/al")).toBe("~");
  });
  it("leaves other folders and lookalike prefixes alone", () => {
    expect(displayFolder("/tmp/a.md", "/home/al")).toBe("/tmp");
    expect(displayFolder("/home/alex/a.md", "/home/al")).toBe("/home/alex");
    expect(displayFolder("/tmp/a.md", "")).toBe("/tmp");
  });
});

describe("elideMiddle", () => {
  it("leaves a path that fits", () => {
    expect(elideMiddle("/tmp/a")).toBe("/tmp/a");
    expect(elideMiddle("x".repeat(40))).toBe("x".repeat(40));
  });
  it("drops middle segments and keeps the head and the leaf", () => {
    const out = elideMiddle("~/projects/clients/acme/website/redesign/notes");
    expect(out).toBe("~/…/clients/acme/website/redesign/notes");
    expect(out.length).toBeLessThanOrEqual(40);
    expect(elideMiddle("/home/al/a/very/long/folder/path/that/keeps/going/leaf")).toMatch(/^\/…\/.*leaf$/);
  });
  it("always keeps the last segment, cutting it when it alone is too long", () => {
    const out = elideMiddle(`/a/${"z".repeat(60)}`);
    expect(out.startsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(40);
  });
  it("handles Windows separators", () => {
    const out = elideMiddle("C:\\Users\\al\\Documents\\projects\\clients\\acme\\website\\notes");
    expect(out.startsWith("C:\\…\\")).toBe(true);
    expect(out.endsWith("\\notes")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(40);
  });
});

describe("displayFolder, long paths", () => {
  it("elides after shortening the home directory", () => {
    const out = displayFolder("/home/al/work/clients/acme/website/redesign/final/drafts/a.md", "/home/al");
    expect(out.startsWith("~/…/")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out).not.toContain("/home/al");
  });
});

describe("HandleTable", () => {
  const make = (max: number): HandleTable => { let n = 0; return new HandleTable(max, () => `id${n++}`); };
  it("gives a stable id per path and resolves it back", () => {
    const t = make(5);
    const id = t.handle("/a.md");
    expect(t.handle("/a.md")).toBe(id);
    expect(t.pathOf(id)).toBe("/a.md");
  });
  it("does not resolve unknown ids, and never treats a path as an id", () => {
    const t = make(5);
    t.handle("/a.md");
    expect(t.pathOf("nope")).toBeNull();
    expect(t.pathOf("/a.md")).toBeNull();
    expect(t.pathOf(5 as unknown as string)).toBeNull();
  });
  it("evicts the oldest handle beyond the cap", () => {
    const t = make(2);
    const a = t.handle("/a"); t.handle("/b"); t.handle("/c");
    expect(t.pathOf(a)).toBeNull();
    expect(t.handle("/a")).not.toBe(a);
  });
});

describe("safeFileName", () => {
  it("keeps the last segment only and strips what a file system or dialog would misread", () => {
    expect(safeFileName("notes.md")).toBe("notes.md");
    expect(safeFileName("../../etc/passwd")).toBe("passwd");
    expect(safeFileName("C:\\Users\\a\\b.txt")).toBe("b.txt");
    expect(safeFileName('a<b>:"|?*.md')).toBe("a_b______.md");
    expect(safeFileName("x\u0000\n.md")).toBe("x__.md");
  });
  it("falls back for empty, dot-only and over-long names", () => {
    for (const n of ["", "  ", "..", "/", "a/"]) expect(safeFileName(n)).toBe("Untitled.md");
    expect(safeFileName("x".repeat(500))).toHaveLength(120);
    expect(safeFileName("", "fallback.txt")).toBe("fallback.txt");
  });
});
