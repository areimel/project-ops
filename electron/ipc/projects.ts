import { OPEN_TARGETS, PROJECT_LINK_KEYS, type ProjectPatch } from "../../shared/projects";
import {
  addFolder, addRoot, copyPath, launchers, listViews, open, openLink, refresh, remove, removeRoot, restore,
  rootViews, scan, update,
} from "../features/projects";
import { handle, type Check } from "./handle";
import { v } from "./validate";

// Records and roots by id, links by key, targets by name: no channel takes a path, a URL or a command.
// The patch is the one raw argument, and it goes straight into healProjectPatch (features/projects.ts).
const patch = v.raw as Check<ProjectPatch>;

export function register(): void {
  handle("projects:list", v.none, () => listViews());
  handle("projects:update", v.args(v.recordId, patch), (id, raw) => update(id, raw));
  handle("projects:remove", v.args(v.recordId), (id) => remove(id));
  handle("projects:restore", v.args(v.recordId), (id) => restore(id));
  handle("projects:add-folder", v.none, () => addFolder());
  handle("projects:roots-list", v.none, () => rootViews());
  handle("projects:roots-add", v.none, () => addRoot());
  handle("projects:roots-remove", v.args(v.recordId), (id) => removeRoot(id));
  handle("projects:scan", v.none, () => scan());
  handle("projects:refresh", v.args(v.recordId), (id) => refresh(id));
  handle("projects:open", v.args(v.recordId, v.oneOf(OPEN_TARGETS)), (id, target) => open(id, target));
  handle("projects:open-link", v.args(v.recordId, v.oneOf(PROJECT_LINK_KEYS)), (id, key) => openLink(id, key));
  handle("projects:copy-path", v.args(v.recordId), (id) => copyPath(id));
  handle("projects:launchers", v.none, () => launchers());
}
