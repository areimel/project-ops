import type { CollectionSpec } from "../../shared/collections/base";
import { createCollection, type Collection } from "./collectionCore";
import { log } from "../features/logger";
import { quarantineJson, readJsonFile, removeJson, writeJson } from "./jsonStore";

export type { Collection };
export { createCollection };

const cache = new Map<string, Collection<unknown>>();

/** Lazily created, one per spec name; reads and writes `userData/<name>.json` as `{ version, items }`. */
export function openCollection<F>(spec: CollectionSpec<F>): Collection<F> {
  let c = cache.get(spec.name);
  if (!c) {
    const file = `${spec.name}.json`;
    c = createCollection<unknown>(spec as { name: string; version: number; max: number; heal(raw: unknown): unknown }, {
      read: () => {
        const r = readJsonFile(file);
        if (r.status === "unreadable") throw r.error;
        return r.status === "ok" ? r.value : undefined;
      },
      write: (envelope) => { if (!writeJson(file, envelope)) throw new Error("the file could not be written"); },
      quarantine: () => {
        try { log.warn("store", `${file} is unreadable; moved to ${quarantineJson(file)}`); } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;   // already gone: nothing to protect
        }
      },
      remove: () => removeJson(file),
    });
    cache.set(spec.name, c);
  }
  return c as Collection<F>;
}
