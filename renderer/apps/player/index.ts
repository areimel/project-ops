import { lazy } from "react";
import type { AppDefinition } from "../types";
import { PLAYER_COMMANDS } from "./playerModel";

export const player: AppDefinition = {
  id: "player",
  name: "Player",
  icon: "player",
  summary: "Custom file protocol and a native video player",
  component: lazy(() => import("./PlayerApp")),
  commands: PLAYER_COMMANDS,
};
