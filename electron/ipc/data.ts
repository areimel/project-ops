import { app, shell } from "electron";
import { exportData, importData, resetData } from "../store/dataTransfer";
import { handle } from "./handle";
import { v } from "./validate";

export function register(): void {
  handle("data:export", v.none, () => exportData());
  handle("data:import", v.none, () => importData());
  handle("data:reset", v.none, () => resetData());
  handle("data:show-folder", v.none, async () => { await shell.openPath(app.getPath("userData")); });
}
