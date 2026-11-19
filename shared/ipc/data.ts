import { invoke } from "./define";

export const dataIpc = {
  "data:export": invoke<[], { saved: boolean }>(),       // save dialog in main
  "data:import": invoke<[], { imported: boolean; counts: Record<string, number> }>(),
  "data:reset": invoke<[], void>(),                      // deletes collections and settings; emits changes
  "data:show-folder": invoke<[], void>(),                // shell.openPath(userData)
} as const;
