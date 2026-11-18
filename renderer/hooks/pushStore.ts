import { errorMessage } from "../utils/errorMessage";

export interface PushSnapshot<T> { value: T; status: "loading" | "ready" | "error"; error: string | null }

export interface PushStore<T> {
  getSnapshot(): PushSnapshot<T>;
  /** The first listener starts the load and the push subscription. */
  subscribe(listener: () => void): () => void;
  reload(): Promise<void>;
  /** Treated like a push from main (a mutation result, for example). */
  set(value: T): void;
}

/**
 * "Load once, then follow main's push" as an external store for useSyncExternalStore.
 * A push (or `set`) that arrives while a load is in flight wins over that load's result,
 * and a superseded reload never overwrites a newer one. Snapshots change identity only on a change.
 */
export function createPushStore<T>(opts: {
  load: () => Promise<T>;
  subscribe: (onPush: (value: T) => void) => () => void;
  initial: T;
}): PushStore<T> {
  let snap: PushSnapshot<T> = { value: opts.initial, status: "loading", error: null };
  const listeners = new Set<() => void>();
  let started = false;
  let loads = 0;     // latest load wins
  let pushes = 0;    // a push after a load began makes that load stale
  let inFlight = false;

  function publish(next: PushSnapshot<T>): void {
    snap = next;
    for (const cb of [...listeners]) cb();
  }

  function set(value: T): void {
    pushes++;
    publish({ value, status: "ready", error: null });
  }

  async function reload(): Promise<void> {
    const mine = ++loads;
    const pushesAtStart = pushes;
    inFlight = true;
    if (snap.status === "error") publish({ value: snap.value, status: "loading", error: null });
    try {
      const value = await opts.load();
      if (mine !== loads) return;
      inFlight = false;
      if (pushes === pushesAtStart) publish({ value, status: "ready", error: null });
    } catch (e) {
      if (mine !== loads) return;
      inFlight = false;
      if (pushes === pushesAtStart) publish({ value: snap.value, status: "error", error: errorMessage(e) });
    }
  }

  return {
    getSnapshot: () => snap,
    subscribe(listener) {
      listeners.add(listener);
      if (!started) {
        started = true;
        opts.subscribe(set);
        void reload();
      } else if (snap.status === "error" && !inFlight) {
        void reload();   // a failed load is retried when a component mounts
      }
      return () => { listeners.delete(listener); };
    },
    reload,
    set,
  };
}
