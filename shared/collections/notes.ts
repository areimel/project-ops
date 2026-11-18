import type { CollectionSpec, RecordBase } from "./base";
import { bool, isObject, str } from "./heal";

export interface NoteFields { title: string; body: string; pinned: boolean }  // title <= 200, body <= 100_000
export type Note = RecordBase & NoteFields;
export const notes: CollectionSpec<NoteFields> = {
  name: "notes", version: 1, max: 1000,
  heal: (raw) => isObject(raw)
    ? { title: str(raw.title, 200), body: str(raw.body, 100_000), pinned: bool(raw.pinned, false) }
    : null,
};
