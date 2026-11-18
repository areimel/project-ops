// Export / import / reset of the whole bundle. The dialogs are the shared helpers in features/files.ts.
import { readFile, stat, writeFile } from "node:fs/promises";
import { brand } from "../../shared/brand";
import { pickOpenFile, pickSaveFile } from "../features/files";
import { getWindow } from "../window";
import { buildBundle, healBundle } from "./bundle";
import { getSettings, resetSettings, updateSettings } from "./settings";

const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const FILTERS = [{ name: "JSON", extensions: ["json"] }];

export async function exportData(): Promise<{ saved: boolean }> {
  const filePath = await pickSaveFile({
    title: "Export data", filters: FILTERS,
    defaultName: `${brand.packageName}-data-${new Date().toISOString().slice(0, 10)}.json`,
  });
  if (!filePath || !getWindow()) return { saved: false };
  await writeFile(filePath, JSON.stringify(buildBundle(getSettings(), {}), null, 2));
  return { saved: true };
}

/** Applies only the settings the file contains (collections will be replaced here once there are any). */
export async function importData(): Promise<{ imported: boolean; counts: Record<string, number> }> {
  const path = await pickOpenFile({ title: "Import data", filters: FILTERS });
  if (!path || !getWindow()) return { imported: false, counts: {} };
  if ((await stat(path)).size > MAX_IMPORT_BYTES) throw new Error("That file is too large to be an export from this app.");
  let raw: unknown;
  try { raw = JSON.parse(await readFile(path, "utf8")); } catch { raw = null; }
  if (!getWindow()) return { imported: false, counts: {} };
  const bundle = healBundle(raw);
  if (!bundle) throw new Error(`That file is not an export from ${brand.name}.`);
  const counts: Record<string, number> = {};
  updateSettings(bundle.settings);
  return { imported: true, counts };
}

/**
 * Data reset: the settings are deleted; the change is pushed to the renderer by the listener. The window position and the log files are kept on purpose.
 */
export function resetData(): void {
  resetSettings();
}
