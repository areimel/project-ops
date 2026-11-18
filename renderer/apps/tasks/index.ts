import { lazy } from "react";
import type { AppDefinition } from "../types";

export const tasks: AppDefinition = {
  id: "tasks",
  name: "Tasks",
  icon: "tasks",
  summary: "Checklist with filters, reordering and undo",
  component: lazy(() => import("./TasksApp")),
  commands: [
    { id: "tasks.new", label: "New task", group: "Tasks", keys: ["n"] },
    { id: "tasks.clearDone", label: "Clear finished tasks", group: "Tasks" },
    { id: "tasks.filterAll", label: "Show all tasks", group: "Tasks", keys: ["1"] },
    { id: "tasks.filterActive", label: "Show active tasks", group: "Tasks", keys: ["2"] },
    { id: "tasks.filterDone", label: "Show finished tasks", group: "Tasks", keys: ["3"] },
  ],
};
