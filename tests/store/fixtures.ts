// Sample collection specs for the generic store tests. They stand in for a real app's specs.
import type { CollectionSpec } from "../../shared/collections/base";
import { bool, isObject, isoDate, str } from "../../shared/collections/heal";

export interface TaskFields { title: string; done: boolean; due: string | null }
export const tasks: CollectionSpec<TaskFields> = {
  name: "tasks", version: 1, max: 2000,
  heal: (raw) => {
    if (!isObject(raw)) return null;
    const title = str(raw.title, 500);
    if (title.trim() === "") return null;   // a task without a title is unusable
    return { title, done: bool(raw.done, false), due: isoDate(raw.due) };
  },
};

export interface NoteFields { title: string; body: string; pinned: boolean }
export const notes: CollectionSpec<NoteFields> = {
  name: "notes", version: 1, max: 1000,
  heal: (raw) => isObject(raw)
    ? { title: str(raw.title, 200), body: str(raw.body, 100_000), pinned: bool(raw.pinned, false) }
    : null,
};
