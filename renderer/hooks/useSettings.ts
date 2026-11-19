import { useCallback, useSyncExternalStore } from "react";
import { defaultSettings, type Settings } from "../../shared/settings";
import { createPushStore } from "./pushStore";

/** Defaults until `settings:get` resolves; then follows `settings:changed`. */
const store = createPushStore<Settings>({
  load: () => window.app.invoke("settings:get"),
  subscribe: (onPush) => window.app.on("settings:changed", onPush),
  initial: defaultSettings(),
});

async function patchSettings(patch: Partial<Settings>): Promise<void> {
  store.set(await window.app.invoke("settings:set", patch));
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => Promise<void>] {
  return [useSyncExternalStore(store.subscribe, () => store.getSnapshot().value), patchSettings];
}

export function useSetting<K extends keyof Settings>(key: K): [Settings[K], (value: Settings[K]) => void] {
  const value = useSyncExternalStore(store.subscribe, () => store.getSnapshot().value[key]);
  const setValue = useCallback((v: Settings[K]) => {
    patchSettings({ [key]: v } as Partial<Settings>).catch((e: unknown) => console.error(`Could not save ${key}:`, e));
  }, [key]);
  return [value, setValue];
}
