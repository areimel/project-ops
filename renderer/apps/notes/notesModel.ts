import type { Note } from "../../../shared/collections/notes";

export type Draft = Pick<Note, "title" | "body">;

/** What the list shows for a note: its title, else the first line of the body. */
export function displayTitle(n: Draft): string {
  const title = n.title.trim();
  if (title) return title;
  const firstLine = n.body.split("\n").find((l) => l.trim() !== "");
  return firstLine ? firstLine.trim().slice(0, 80) : "Untitled note";
}

/** Pinned notes first, then the most recently edited. Returns a new array. */
export function sortNotes(notes: readonly Note[]): Note[] {
  return [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

/** Every word of the query must appear in the title or body, in any order, ignoring case. */
export function filterNotes(notes: readonly Note[], query: string): Note[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...notes];
  return notes.filter((n) => {
    const text = `${n.title}\n${n.body}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

/** The fields that differ between the note and the draft, or null when there is nothing to save. */
export function draftPatch(note: Draft, draft: Draft): Partial<Draft> | null {
  const patch: Partial<Draft> = {};
  if (draft.title !== note.title) patch.title = draft.title;
  if (draft.body !== note.body) patch.body = draft.body;
  return Object.keys(patch).length > 0 ? patch : null;
}

export const noteCount = (n: number): string => `${n} ${n === 1 ? "note" : "notes"}`;

/** A time for today, a short date for any other day. */
export function shortDate(ms: number, now: number): string {
  const d = new Date(ms);
  const today = new Date(now).toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
