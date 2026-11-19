import type { ResourceLinkPatch } from "../../shared/resources/links";
import { create, listViews, open, remove, update } from "../features/resources";
import { handle, type Check } from "./handle";
import { v } from "./validate";

// The patch is the one raw argument and goes straight into healResourceLinkPatch (features/resources.ts), which
// keeps a URL only when it is a safe https link. Everything else addresses a link by record id.
const patch = v.raw as Check<ResourceLinkPatch>;

export function register(): void {
  handle("resources:list", v.none, () => listViews());
  handle("resources:create", v.args(patch), (raw) => create(raw));
  handle("resources:update", v.args(v.recordId, patch), (id, raw) => update(id, raw));
  handle("resources:remove", v.args(v.recordId), (id) => remove(id));
  handle("resources:open", v.args(v.recordId), (id) => open(id));
}
