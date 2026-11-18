import { useCallback, useSyncExternalStore } from "react";
import { defaultSettings, type Settings } from "../../shared/settings";

/** Module store over useSyncExternalStore; defaults until `settings:get` resolves. */
let current: Settings = defaultSettings();
const listeners = new Set<() => void>();
let listening = false;
let loaded = false;
let loading = false;

function publish(next: Settings): void {
  current = next;
  for (const cb of [...listeners]) cb();
}

function start(): void {
  if (!listening) {
    listening = true;
    window.app.on("settings:changed", publish);
  }
  if (loaded || loading) return;
  loading = true;
  window.app.invoke("settings:get").then(
    (s) => { loaded = true; loading = false; publish(s); },
    () => { loading = false; },   // defaults stay; retried on the next subscribe
  );
}

function subscribe(cb: () => void): () => void {
  start();
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

const get = (): Settings => current;

async function patchSettings(patch: Partial<Settings>): Promise<void> {
  publish(await window.app.invoke("settings:set", patch));
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => Promise<void>] {
  return [useSyncExternalStore(subscribe, get), patchSettings];
}

export function useSetting<K extends keyof Settings>(key: K): [Settings[K], (value: Settings[K]) => void] {
  const value = useSyncExternalStore(subscribe, () => current[key]);
  const setValue = useCallback((v: Settings[K]) => {
    patchSettings({ [key]: v } as Partial<Settings>).catch((e: unknown) => console.error(`Could not save ${key}:`, e));
  }, [key]);
  return [value, setValue];
}
