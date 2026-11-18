import { lazy } from "react";
import type { AppDefinition } from "../types";

export const system: AppDefinition = {
  id: "system",
  name: "System",
  icon: "system",
  summary: "Live system information pushed from main",
  component: lazy(() => import("./SystemApp")),
  commands: [],
};
