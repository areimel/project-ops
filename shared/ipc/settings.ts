import type { Settings } from "../settings";
import { event, invoke } from "./define";

export const settingsIpc = {
  "settings:get": invoke<[], Settings>(),
  "settings:set": invoke<[patch: unknown], Settings>(),
  "settings:changed": event<Settings>(),
} as const;
