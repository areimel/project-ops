import { describe, expect, it } from "vitest";
import { editorReducer, isDirty, openError, saveError, untitledName, wordCount, type EditorState } from "../../renderer/apps/editor/editorModel";
import { renderMarkdown } from "../../renderer/apps/editor/markdown";

const file = { fileId: "ab12", name: "plan.md", folder: "~/docs", text: "# Plan" };

describe("editorReducer", () => {
  it("opens a file clean", () => {
    const s = editorReducer(null, { type: "opened", file });
    expect(s).toMatchObject({ fileId: "ab12", name: "plan.md", text: "# Plan", savedText: "# Plan" });
    expect(isDirty(s)).toBe(false);
  });
  it("is dirty exactly while the text differs from the saved text", () => {
    let s: EditorState = editorReducer(null, { type: "opened", file });
    s = editorReducer(s, { type: "edited", text: "# Plan!" });
    expect(isDirty(s)).toBe(true);
    s = editorReducer(s, { type: "edited", text: "# Plan" });
    expect(isDirty(s)).toBe(false);
  });
  it("starts a new file with no id and no text", () => {
    const s = editorReducer(editorReducer(null, { type: "opened", file }), { type: "new" });
    expect(s).toMatchObject({ fileId: null, name: "Untitled", text: "", savedText: "" });
    expect(isDirty(s)).toBe(false);
  });
  it("saving records the text that was written, so typing during a save stays dirty", () => {
    let s: EditorState = editorReducer(null, { type: "new" });
    s = editorReducer(s, { type: "edited", text: "one" });
    const written = s!.text;
    s = editorReducer(s, { type: "edited", text: "one two" });
    s = editorReducer(s, { type: "saved", file: { fileId: "cd34", name: "one.md", folder: "~" }, text: written });
    expect(s).toMatchObject({ fileId: "cd34", name: "one.md", savedText: "one" });
    expect(isDirty(s)).toBe(true);
  });
  it("ignores edits and saves when nothing is open", () => {
    expect(editorReducer(null, { type: "edited", text: "x" })).toBeNull();
    expect(editorReducer(null, { type: "saved", file: { fileId: "a", name: "a.md", folder: "" }, text: "" })).toBeNull();
  });
});

describe("untitledName", () => {
  it("uses the first heading", () => expect(untitledName("\n# Meeting notes, Friday\nbody")).toBe("meeting-notes-friday.md"));
  it("falls back for empty or symbol-only text", () => {
    expect(untitledName("")).toBe("untitled.md");
    expect(untitledName("***")).toBe("untitled.md");
  });
  it("keeps letters from other scripts and caps the length", () => {
    expect(untitledName("Überblick")).toBe("überblick.md");
    expect(untitledName("a".repeat(100))).toBe(`${"a".repeat(40)}.md`);
  });
});

describe("wordCount and messages", () => {
  it("counts words", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("  one  two\nthree ")).toBe(3);
  });
  it("says what to do for the errors main throws", () => {
    expect(openError(new Error("Too large"))).toMatch(/2 MB/);
    expect(openError(new Error("Not a text file"))).toMatch(/\.md/);
    expect(saveError(new Error("EACCES"), "a.md")).toMatch(/Your text is still here/);
  });
});

describe("renderMarkdown", () => {
  it("renders headings, lists, code and tables", () => {
    const html = renderMarkdown("# T\n\n- a\n- b\n\n```\ncode\n```\n\n| x | y |\n|---|---|\n| 1 | 2 |\n");
    for (const tag of ["<h1>", "<ul>", "<pre>", "<table>"]) expect(html).toContain(tag);
  });
  it("shows raw HTML as text instead of rendering it", () => {
    const html = renderMarkdown("<script>alert(1)</script> <img src=x onerror=alert(1)>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });
  it("does not turn script URLs into links", () => {
    expect(renderMarkdown("[x](javascript:alert(1))")).not.toContain("<a ");
  });
  it("recognises bare URLs as (inert) links", () => expect(renderMarkdown("see https://example.com")).toContain('<span class="md-link" title="https://example.com">'));
  it("replaces images with their description", () => {
    const html = renderMarkdown("![a diagram](https://example.com/x.png)");
    expect(html).not.toContain("<img");
    expect(html).toContain("a diagram");
  });
});
