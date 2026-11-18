import { lazy } from "react";
import type { AppDefinition } from "../types";

export const projects: AppDefinition = {
  id: "projects",
  name: "Projects",
  icon: "folder",
  summary: "Your local projects at a glance: open them in an editor or a terminal.",
  component: lazy(() => import("./ProjectsApp")),
};
