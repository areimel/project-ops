import type { ResourceLinkPatch, ResourceLinkView } from "../resources/links";
import { event, invoke } from "./define";

// The owner's resource links. A URL arrives only inside a patch, which main heals (https only, no credentials)
// before storing; opening goes by record id, never by URL.
export const resourcesIpc = {
  "resources:list": invoke<[], ResourceLinkView[]>(),
  "resources:create": invoke<[patch: ResourceLinkPatch], ResourceLinkView>(),     // needs a name and a URL
  "resources:update": invoke<[id: string, patch: ResourceLinkPatch], ResourceLinkView>(),
  "resources:remove": invoke<[id: string], void>(),
  "resources:open": invoke<[id: string], void>(),                                // URL looked up in the record
  "resources:changed": event<ResourceLinkView[]>(),                              // after every write
} as const;
