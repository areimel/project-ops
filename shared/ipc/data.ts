import type { AnyRecord, CollectionName } from "../collections";
import type { Removed } from "../collections/base";
import { event, invoke } from "./define";

export const dataIpc = {
  "data:list": invoke<[CollectionName], AnyRecord[]>(),
  "data:create": invoke<[CollectionName, input: unknown], AnyRecord>(),
  "data:update": invoke<[CollectionName, id: string, patch: unknown], AnyRecord>(),
  "data:remove": invoke<[CollectionName, id: string], Removed<AnyRecord>>(),
  "data:restore": invoke<[CollectionName, record: unknown, index: number], AnyRecord>(),
  "data:reorder": invoke<[CollectionName, ids: string[]], void>(),
  "data:changed": event<{ name: CollectionName; items: AnyRecord[] }>(),
  "data:export": invoke<[], { saved: boolean }>(),       // save dialog in main
  "data:import": invoke<[], { imported: boolean; counts: Record<CollectionName, number> }>(),
  "data:reset": invoke<[], void>(),                      // deletes collections and settings; emits changes
  "data:show-folder": invoke<[], void>(),                // shell.openPath(userData)
} as const;
