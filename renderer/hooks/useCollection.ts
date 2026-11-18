import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import type { AnyRecord, CollectionName, FieldsOf, RecordOf } from "../../shared/collections";
import type { Removed } from "../../shared/collections/base";

interface Snapshot { items: AnyRecord[]; status: "loading" | "ready" | "error"; error: string | null }

/** One shared store per collection name, so every component sees the same list. */
interface Store { snap: Snapshot; listeners: Set<() => void>; loading: boolean; pushes: number }
const stores = new Map<CollectionName, Store>();
let listening = false;

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

function set(store: Store, snap: Snapshot): void {
  store.snap = snap;
  for (const cb of [...store.listeners]) cb();
}

function storeFor(name: CollectionName): Store {
  let s = stores.get(name);
  if (!s) {
    s = { snap: { items: [], status: "loading", error: null }, listeners: new Set(), loading: false, pushes: 0 };
    stores.set(name, s);
  }
  if (!listening) {
    listening = true;
    // The list changes only when main pushes: this is the single writer after the first load.
    window.app.on("data:changed", ({ name: n, items }) => {
      const st = storeFor(n);
      st.pushes++;
      set(st, { items, status: "ready", error: null });
    });
  }
  return s;
}

function load(name: CollectionName): void {
  const store = storeFor(name);
  if (store.loading || store.snap.status === "ready") return;
  store.loading = true;
  const pushesAtStart = store.pushes;
  window.app.invoke("data:list", name).then(
    (items) => {
      store.loading = false;
      // A push that arrived while the list was in flight is newer than this result: keep it.
      if (store.pushes === pushesAtStart) set(store, { items, status: "ready", error: null });
    },
    (e: unknown) => {
      store.loading = false;
      set(store, { items: [], status: "error", error: message(e) });
    },
  );
}

/** Items update only from `data:changed`; mutations await the invoke. The one cast from AnyRecord lives here. */
export function useCollection<N extends CollectionName>(name: N): {
  items: RecordOf<N>[]; status: "loading" | "ready" | "error"; error: string | null;
  create(input: Partial<FieldsOf<N>>): Promise<RecordOf<N>>;
  update(id: string, patch: Partial<FieldsOf<N>>): Promise<RecordOf<N>>;
  remove(id: string): Promise<Removed<RecordOf<N>>>;
  restore(removed: Removed<RecordOf<N>>): Promise<void>;
  reorder(ids: string[]): Promise<void>;
  /** Reads the list again after a failed load. */
  reload(): void;
} {
  const subscribe = useCallback((cb: () => void) => {
    const s = storeFor(name);
    s.listeners.add(cb);
    return () => { s.listeners.delete(cb); };
  }, [name]);
  const snap = useSyncExternalStore(subscribe, () => storeFor(name).snap);
  useEffect(() => { load(name); }, [name]);

  const api = useMemo(() => ({
    create: (input: Partial<FieldsOf<N>>) => window.app.invoke("data:create", name, input) as Promise<RecordOf<N>>,
    update: (id: string, patch: Partial<FieldsOf<N>>) => window.app.invoke("data:update", name, id, patch) as Promise<RecordOf<N>>,
    remove: (id: string) => window.app.invoke("data:remove", name, id) as Promise<Removed<RecordOf<N>>>,
    restore: async (removed: Removed<RecordOf<N>>) => { await window.app.invoke("data:restore", name, removed.record, removed.index); },
    reorder: (ids: string[]) => window.app.invoke("data:reorder", name, ids),
  }), [name]);

  const reload = useCallback(() => {
    const s = storeFor(name);
    if (s.snap.status === "error") set(s, { items: [], status: "loading", error: null });
    load(name);
  }, [name]);

  return { items: snap.items as RecordOf<N>[], status: snap.status, error: snap.error, reload, ...api };
}
