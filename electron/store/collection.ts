import { COLLECTIONS, type CollectionName, type FieldsOf } from "../../shared/collections";
import { createCollection, type Collection } from "./collectionCore";
import { log } from "../features/logger";
import { quarantineJson, readJsonFile, removeJson, writeJson } from "./jsonStore";

export type { Collection };
export { createCollection };

const cache = new Map<CollectionName, Collection<unknown>>();

/** Lazily created, one per name; reads and writes `userData/<name>.json` as `{ version, items }`. */
export function collection<N extends CollectionName>(name: N): Collection<FieldsOf<N>> {
  let c = cache.get(name);
  if (!c) {
    const spec = COLLECTIONS[name];
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
    cache.set(name, c);
  }
  return c as Collection<FieldsOf<N>>;
}
