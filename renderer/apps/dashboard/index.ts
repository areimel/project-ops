import { lazy } from "react";
import type { AppDefinition } from "../types";

export const dashboard: AppDefinition = {
  id: "dashboard",
  name: "Dashboard",
  icon: "home",
  summary: "Your launchpad: pinned and recently opened projects, and links to the tools you use.",
  component: lazy(() => import("./DashboardApp")),
  commands: [
    { id: "dashboard.add-link", label: "Add a resource link", group: "Dashboard" },
  ],
};
