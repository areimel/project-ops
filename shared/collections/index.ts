import type { CollectionSpec, RecordBase } from "./base";
import { notes } from "./notes";
import { tasks } from "./tasks";
import { snippets } from "./snippets";

export const COLLECTIONS = { notes, tasks, snippets } as const;
export type CollectionName = keyof typeof COLLECTIONS;
export type FieldsOf<N extends CollectionName> = (typeof COLLECTIONS)[N] extends CollectionSpec<infer F> ? F : never;
export type RecordOf<N extends CollectionName> = RecordBase & FieldsOf<N>;
export type AnyRecord = RecordOf<CollectionName>;
