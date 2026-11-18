import type { ComponentType, LazyExoticComponent } from "react";
import type { CommandSpec } from "../../shared/commands";
import type { IconName } from "../components/common/Icon";

export interface AppDefinition {
  id: string;                     // ^[a-z][a-z0-9-]{0,31}$, also the CSS prefix and command prefix
  name: string;                   // "Notes"
  icon: IconName;
  summary: string;                // sheet index line: what it demonstrates
  component: LazyExoticComponent<ComponentType>;   // lazy(() => import("./NotesApp"))
  commands?: readonly CommandSpec[];               // static; ids start with `${id}.`
}
