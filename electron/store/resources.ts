// The main-only resource links collection; the page reaches it only through the resources:* handlers.
import { resourceLinkSpec, type ResourceLinkFields } from "../../shared/resources/links";
import { openCollection, type Collection } from "./collection";

export const resourceLinksStore = (): Collection<ResourceLinkFields> => openCollection(resourceLinkSpec);
