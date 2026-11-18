import { lazy } from "react";
import type { AppDefinition } from "../types";

export const projects: AppDefinition = {
  id: "projects",
  name: "Projects",
  icon: "folder",
  summary: "Your local projects at a glance: open them in an editor or a terminal.",
  component: lazy(() => import("./ProjectsApp")),
  commands: [
    { id: "projects.search", label: "Search projects", group: "Projects", keys: ["/"] },
    { id: "projects.add-folder", label: "Add a project folder", group: "Projects", accelerator: "CmdOrCtrl+O" },
    { id: "projects.rescan", label: "Rescan project folders", group: "Projects", accelerator: "F5" },
    { id: "projects.clear-filters", label: "Clear filters", group: "Projects" },
  ],
};
