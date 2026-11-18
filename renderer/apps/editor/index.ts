import { lazy } from "react";
import type { AppDefinition } from "../types";
import { EDITOR_COMMANDS } from "./commands";

export const editor: AppDefinition = {
  id: "editor",
  name: "Editor",
  icon: "editor",
  summary: "Open and save files, recents, Markdown preview",
  component: lazy(() => import("./EditorApp")),
  commands: EDITOR_COMMANDS,
};
