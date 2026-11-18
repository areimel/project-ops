import { useSyncExternalStore } from "react";
import type { InstalledLaunchers } from "../../shared/ipc/projects";
import type { RootView } from "../../shared/projects";
import { createPushStore, type PushSnapshot } from "./pushStore";

const rootsStore = createPushStore<RootView[]>({
  load: () => window.app.invoke("projects:roots-list"),
  subscribe: (onPush) => window.app.on("projects:roots-changed", onPush),
  initial: [],
});

/** Scan roots; the list changes only when main pushes `projects:roots-changed`. */
export function useRoots(): {
  roots: RootView[]; status: PushSnapshot<RootView[]>["status"];
  add(): Promise<RootView | null>; remove(id: string): Promise<void>;
} {
  const snap = useSyncExternalStore(rootsStore.subscribe, rootsStore.getSnapshot);
  return {
    roots: snap.value,
    status: snap.status,
    add: () => window.app.invoke("projects:roots-add"),
    remove: (id) => window.app.invoke("projects:roots-remove", id),
  };
}

// No query channel exists for the scan flag, so it starts false and follows the push.
const scanStore = createPushStore<boolean>({
  load: () => Promise.resolve(false),
  subscribe: (onPush) => window.app.on("projects:scan-state", (p) => onPush(p.scanning)),
  initial: false,
});

export function useScanState(): boolean {
  return useSyncExternalStore(scanStore.subscribe, () => scanStore.getSnapshot().value);
}

const launchersStore = createPushStore<InstalledLaunchers | null>({
  load: () => window.app.invoke("projects:launchers"),
  subscribe: () => () => {},   // no push channel
  initial: null,
});

/** Editors and terminals found on PATH; null until loaded (or if the load failed). */
export function useLaunchers(): InstalledLaunchers | null {
  return useSyncExternalStore(launchersStore.subscribe, () => launchersStore.getSnapshot().value);
}

/** Look again, e.g. after the user installs an editor. */
export const reloadLaunchers = (): Promise<void> => launchersStore.reload();
