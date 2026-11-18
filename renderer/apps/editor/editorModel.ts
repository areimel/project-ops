import type { OpenedFile, SavedFile } from "../../../shared/ipc/editor";

/** The document on screen. `fileId` is null until the first save: main hands out ids, the renderer never sees a path. */
export interface Doc { fileId: string | null; name: string; folder: string; text: string; savedText: string }
export type EditorState = Doc | null;   // null: nothing open

export type EditorAction =
  | { type: "opened"; file: OpenedFile }
  | { type: "new" }
  | { type: "edited"; text: string }
  | { type: "saved"; file: SavedFile; text: string };   // `text` is what was written, which may be older than what is typed now

export const UNTITLED = "Untitled";

export const isDirty = (d: EditorState): boolean => d !== null && d.text !== d.savedText;

export function editorReducer(state: EditorState, a: EditorAction): EditorState {
  switch (a.type) {
    case "opened": return { fileId: a.file.fileId, name: a.file.name, folder: a.file.folder, text: a.file.text, savedText: a.file.text };
    case "new": return { fileId: null, name: UNTITLED, folder: "", text: "", savedText: "" };
    case "edited": return state && { ...state, text: a.text };
    case "saved": return state && { ...state, fileId: a.file.fileId, name: a.file.name, folder: a.file.folder, savedText: a.text };
  }
}

/** A file name for Save as: the first heading or line of text, made safe, else "untitled.md". */
export function untitledName(text: string): string {
  const first = text.split("\n").map((l) => l.replace(/^#+\s*/, "").trim()).find((l) => l) ?? "";
  const slug = first.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
  return `${slug || "untitled"}.md`;
}

export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** What went wrong and what to do, from the short messages main throws. */
export function openError(e: unknown): string {
  const m = e instanceof Error ? e.message : "";
  if (m === "Too large") return "That file is larger than 2 MB, which is too big for this editor. Open a smaller one.";
  if (m === "Not a text file") return "That file is not plain text. Open a .md, .markdown or .txt file.";
  return `The file could not be opened. ${m}`.trim();
}

export function saveError(e: unknown, name: string): string {
  const m = e instanceof Error ? e.message : "";
  if (m === "Too large") return `${name} was not saved because the text is over 2 MB. Cut some of it and save again.`;
  return `${name} was not saved. Your text is still here: check that the folder is writable, then save again.`;
}
