import { snippets as snippetsSpec, type Snippet } from "../../../shared/collections/snippets";

export const LABEL_MAX = 60;
export const SNIPPET_LIMIT = snippetsSpec.max;

/** A label for text saved without one: its first non-empty line, cut to 60 characters. */
export function labelFrom(text: string): string {
  const line = text.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const trimmed = line.trim();
  return trimmed.length > LABEL_MAX ? `${trimmed.slice(0, LABEL_MAX - 1)}…` : trimmed;
}

/** Snippets whose label or text contains the query, ignoring case. An empty query keeps everything. */
export function filterSnippets(list: readonly Snippet[], query: string): Snippet[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...list];
  return list.filter((s) => s.label.toLowerCase().includes(q) || s.text.toLowerCase().includes(q));
}
