import type { CollectionSpec, RecordBase } from "./base";
import { bool, isObject, isoDate, str } from "./heal";

export interface TaskFields { title: string; done: boolean; due: string | null }  // title <= 500, due YYYY-MM-DD; order = array order
export type Task = RecordBase & TaskFields;
export const tasks: CollectionSpec<TaskFields> = {
  name: "tasks", version: 1, max: 2000,
  heal: (raw) => {
    if (!isObject(raw)) return null;
    const title = str(raw.title, 500);
    if (title.trim() === "") return null;   // a task without a title is unusable
    return { title, done: bool(raw.done, false), due: isoDate(raw.due) };
  },
};
