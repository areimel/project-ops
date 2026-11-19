import { useSyncExternalStore } from "react";
import type { ResourceLinkPatch, ResourceLinkView } from "../../shared/resources/links";
import { createPushStore } from "./pushStore";

const store = createPushStore<ResourceLinkView[]>({
  load: () => window.app.invoke("resources:list"),
  subscribe: (onPush) => window.app.on("resources:changed", onPush),
  initial: [],
});

const api = {
  reload: () => store.reload(),
  create: (patch: ResourceLinkPatch): Promise<ResourceLinkView> => window.app.invoke("resources:create", patch),
  update: (id: string, patch: ResourceLinkPatch): Promise<ResourceLinkView> => window.app.invoke("resources:update", id, patch),
  remove: (id: string): Promise<void> => window.app.invoke("resources:remove", id),
  open: (id: string): Promise<void> => window.app.invoke("resources:open", id),
};

/** The owner's resource links; the list changes only when main pushes `resources:changed`. */
export function useResourceLinks(): {
  links: ResourceLinkView[]; status: "loading" | "ready" | "error"; error: string | null;
} & typeof api {
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return { links: snap.value, status: snap.status, error: snap.error, ...api };
}
