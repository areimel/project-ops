import { app, shell } from "electron";
import { COLLECTIONS, type AnyRecord, type CollectionName } from "../../shared/collections";
import { collection, type Collection } from "../store/collection";
import { exportData, importData, resetData } from "../store/dataTransfer";
import { emit, handle } from "./handle";
import { IpcArgError, v } from "./validate";

/** The one place the per-collection field type is widened: main treats records as opaque beyond heal(). */
const store = (name: CollectionName): Collection<unknown> => collection(name) as Collection<unknown>;

const names = Object.keys(COLLECTIONS) as CollectionName[];

export function register(): void {
  // The renderer's list changes only when this push arrives.
  for (const name of names) {
    store(name).onChange((items) => emit("data:changed", { name, items: items as AnyRecord[] }));
  }

  handle("data:list", v.args(v.collection), (name) => store(name).list() as AnyRecord[]);
  handle("data:create", v.args(v.collection, v.raw), (name, input) => store(name).create(input) as AnyRecord);
  handle("data:update", v.args(v.collection, v.recordId, v.raw), (name, id, patch) => store(name).update(id, patch) as AnyRecord);
  handle("data:remove", v.args(v.collection, v.recordId), (name, id) => store(name).remove(id) as { record: AnyRecord; index: number });
  handle("data:restore", v.args(v.collection, v.raw, v.int(0, 1_000_000)), (name, record, index) => store(name).restore(record, index) as AnyRecord);
  handle("data:reorder", v.args(v.collection, (x, at) => {
    if (!Array.isArray(x) || x.length > 10_000) throw new IpcArgError(at, "a list of ids");
    return x.map((id, i) => v.recordId(id, `${at}[${i}]`));
  }), (name, ids) => store(name).reorder(ids));
  handle("data:export", v.none, () => exportData());
  handle("data:import", v.none, async () => {
    const r = await importData();
    const counts = Object.fromEntries(names.map((n) => [n, r.counts[n] ?? 0])) as Record<CollectionName, number>;
    return { imported: r.imported, counts };
  });
  handle("data:reset", v.none, () => resetData());
  handle("data:show-folder", v.none, async () => { await shell.openPath(app.getPath("userData")); });
}
