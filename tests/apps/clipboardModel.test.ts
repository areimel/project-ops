import { describe, expect, it } from "vitest";
import type { Snippet } from "../../shared/collections/snippets";
import { filterSnippets, labelFrom } from "../../renderer/apps/clipboard/snippetsModel";

const snip = (label: string, text: string) => ({ id: label, label, text }) as unknown as Snippet;

describe("labelFrom", () => {
  it("uses the first non-empty line, trimmed", () => {
    expect(labelFrom("\n  Hello there  \nsecond")).toBe("Hello there");
    expect(labelFrom("a\r\nb")).toBe("a");
  });
  it("cuts a long line to 60 characters", () => {
    const out = labelFrom("x".repeat(100));
    expect(out).toHaveLength(60);
    expect(out.endsWith("…")).toBe(true);
    expect(labelFrom("y".repeat(60))).toBe("y".repeat(60));
  });
  it("is empty for blank text", () => {
    expect(labelFrom("  \n ")).toBe("");
  });
});

describe("filterSnippets", () => {
  const list = [snip("Email", "me@example.com"), snip("Greeting", "Hello EMAIL friends"), snip("Sign-off", "Regards")];
  it("keeps everything for an empty query", () => {
    expect(filterSnippets(list, "  ")).toHaveLength(3);
  });
  it("matches label or text, ignoring case", () => {
    expect(filterSnippets(list, "email").map((s) => s.label)).toEqual(["Email", "Greeting"]);
    expect(filterSnippets(list, "zzz")).toEqual([]);
  });
});
