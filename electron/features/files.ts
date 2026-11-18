import { app, dialog, type FileFilter } from "electron";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { brand } from "../../shared/brand";
import { getWindow } from "../window";
import { safeFileName } from "./filesCore";

export async function pickOpenFile(o: { title: string; filters: FileFilter[] }): Promise<string | null> {
  const parent = getWindow();
  const opts = { title: o.title, filters: o.filters, properties: ["openFile" as const] };
  const r = parent ? await dialog.showOpenDialog(parent, opts) : await dialog.showOpenDialog(opts);
  return r.canceled ? null : (r.filePaths[0] ?? null);
}

/** `defaultName` may come from the renderer: only its file name is used, in a folder main chooses (Documents). */
export async function pickSaveFile(o: { title: string; defaultName: string; filters: FileFilter[] }): Promise<string | null> {
  const parent = getWindow();
  const opts = { title: o.title, defaultPath: join(app.getPath("documents"), safeFileName(o.defaultName)), filters: o.filters };
  const r = parent ? await dialog.showSaveDialog(parent, opts) : await dialog.showSaveDialog(opts);
  return r.canceled || !r.filePath ? null : r.filePath;
}

/** For a path the save dialog did not confirm itself (main added an extension): asks before replacing a file. */
export async function confirmReplace(path: string): Promise<boolean> {
  if (!existsSync(path)) return true;
  const parent = getWindow();
  const opts = {
    type: "warning" as const, buttons: ["Replace", "Cancel"], defaultId: 1, cancelId: 1,
    message: `${basename(path)} already exists. Do you want to replace it?`,
  };
  const r = parent ? await dialog.showMessageBox(parent, opts) : await dialog.showMessageBox(opts);
  return r.response === 0;
}

// Dev only, never in a packaged app: APP_PICK_FOLDER=/abs/path stands in for the folder dialog, which an
// unattended capture run cannot click. Callers apply the same realpath and directory checks as for a real choice.
const devFolder = (): string | undefined => {
  if (app.isPackaged) return undefined;
  const v = process.env[`${brand.envPrefix}_PICK_FOLDER`];
  return v ? v : undefined;
};

/** A folder chosen in a directory dialog on the main window; null on cancel. */
export async function pickFolder(o: { title: string }): Promise<string | null> {
  const dev = devFolder();
  if (dev !== undefined) return dev;
  const parent = getWindow();
  const opts = { title: o.title, properties: ["openDirectory" as const, "createDirectory" as const] };
  const r = parent ? await dialog.showOpenDialog(parent, opts) : await dialog.showOpenDialog(opts);
  return r.canceled ? null : (r.filePaths[0] ?? null);
}
