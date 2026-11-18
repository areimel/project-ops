import { lazy } from "react";
import type { CommandSpec } from "../../../shared/commands";
import type { AppDefinition } from "../types";

export const newsCommands: readonly CommandSpec[] = [
  { id: "news.refresh", label: "Refresh stories", group: "News", keys: ["r"] },
  { id: "news.top", label: "Show top stories", group: "News", keys: ["1"] },
  { id: "news.new", label: "Show new stories", group: "News", keys: ["2"] },
  { id: "news.best", label: "Show best stories", group: "News", keys: ["3"] },
];

export const news: AppDefinition = {
  id: "news",
  name: "News",
  icon: "news",
  summary: "Network fetch through main with cache and offline states",
  component: lazy(() => import("./NewsApp")),
  commands: newsCommands,
};
