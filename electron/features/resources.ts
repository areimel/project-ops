// The resource links feature: what electron/ipc/resources.ts calls. Patches from the page are untrusted and healed
// here; a link is opened by id, with the URL read from the stored record and checked again at open.
import {
  RESOURCE_LIMITS, RESOURCE_MESSAGES, healResourceLinkPatch, resourcePatchProblem, toResourceLinkView,
  type ResourceLinkView,
} from "../../shared/resources/links";
import { emit } from "../ipc/handle";
import { resourceLinksStore } from "../store/resources";
import { openExternalHttps } from "./links";

export const listViews = (): ResourceLinkView[] => resourceLinksStore().list().map(toResourceLinkView);

let initialised = false;

/** Subscribes the page push to the store, once. Call after app ready. */
export function initResources(): void {
  if (initialised) return;
  initialised = true;
  resourceLinksStore().onChange((items) => emit("resources:changed", items.map(toResourceLinkView)));
}

function check(raw: unknown, requireAll: boolean): void {
  const problem = resourcePatchProblem(raw, requireAll);
  if (problem) throw new Error(problem);
}

export function create(raw: unknown): ResourceLinkView {
  const store = resourceLinksStore();
  if (store.list().length >= RESOURCE_LIMITS.max) throw new Error(RESOURCE_MESSAGES.full);
  check(raw, true);
  return toResourceLinkView(store.create(healResourceLinkPatch(raw)));
}

export function update(id: string, raw: unknown): ResourceLinkView {
  check(raw, false);
  return toResourceLinkView(resourceLinksStore().update(id, healResourceLinkPatch(raw)));
}

export function remove(id: string): void {
  resourceLinksStore().remove(id);
}

export function open(id: string): void {
  const rec = resourceLinksStore().get(id);
  if (!rec) throw new Error("Not found");
  if (!openExternalHttps(rec.url)) throw new Error("That link could not be opened.");
}
