import { useSyncExternalStore } from "react";
import type { ScanResult } from "../../shared/ipc/projects";
import type { OpenTarget, ProjectLinkKey, ProjectPatch, ProjectView } from "../../shared/projects";
import { createPushStore } from "./pushStore";

export { useLaunchers, useRoots, useScanState } from "./useProjectRoots";

const store = createPushStore<ProjectView[]>({
  load: () => window.app.invoke("projects:list"),
  subscribe: (onPush) => window.app.on("projects:changed", onPush),
  initial: [],
});

const api = {
  reload: () => store.reload(),
  update: (id: string, patch: ProjectPatch): Promise<ProjectView> => window.app.invoke("projects:update", id, patch),
  remove: (id: string): Promise<void> => window.app.invoke("projects:remove", id),
  restore: (id: string): Promise<void> => window.app.invoke("projects:restore", id),
  addFolder: (): Promise<{ id: string } | null> => window.app.invoke("projects:add-folder"),
  refresh: (id: string): Promise<void> => window.app.invoke("projects:refresh", id),
  scan: (): Promise<ScanResult> => window.app.invoke("projects:scan"),
  open: (id: string, target: OpenTarget): Promise<void> => window.app.invoke("projects:open", id, target),
  openLink: (id: string, key: ProjectLinkKey): Promise<void> => window.app.invoke("projects:open-link", id, key),
  copyPath: (id: string): Promise<void> => window.app.invoke("projects:copy-path", id),
};

/** The list changes only when main pushes `projects:changed`; mutations return the invoke promise. */
export function useProjects(): {
  projects: ProjectView[]; status: "loading" | "ready" | "error"; error: string | null;
} & typeof api {
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return { projects: snap.value, status: snap.status, error: snap.error, ...api };
}
