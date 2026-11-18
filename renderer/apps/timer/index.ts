import { lazy } from "react";
import type { AppDefinition } from "../types";

export const timer: AppDefinition = {
  id: "timer",
  name: "Timer",
  icon: "timer",
  summary: "Main-process timer with notifications and tray status",
  component: lazy(() => import("./TimerApp")),
  commands: [
    { id: "timer.toggle", label: "Start, pause or resume the timer", group: "Timer", keys: [" "] },
    { id: "timer.reset", label: "Reset the timer", group: "Timer", keys: ["r"] },
  ],
};
