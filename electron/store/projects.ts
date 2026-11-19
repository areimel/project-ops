// The two main-only project collections. Neither is in COLLECTIONS, so no generic channel can name them; the
// page reaches them only through the projects:* handlers, which send path-free views.
import { projectSpec, rootSpec } from "../../shared/projects";
import { openCollection, type Collection } from "./collection";
import type { ProjectFields, RootFields } from "../../shared/projects";

export const projectsStore = (): Collection<ProjectFields> => openCollection(projectSpec);
export const rootsStore = (): Collection<RootFields> => openCollection(rootSpec);
