// Export / import / reset of the whole bundle. The dialogs are the shared helpers in features/files.ts.
import { readFile, stat, writeFile } from "node:fs/promises";
import { brand } from "../../shared/brand";
import { COLLECTIONS, type CollectionName } from "../../shared/collections";
import { pickOpenFile, pickSaveFile } from "../features/files";
import { clearNewsCache } from "../features/news";
import { clearRecents } from "../features/recents";
import { getWindow } from "../window";
import { collection } from "./collection";
import { buildBundle, healBundle } from "./bundle";
import { getSettings, resetSettings, updateSettings } from "./settings";

const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const names = Object.keys(COLLECTIONS) as CollectionName[];
const FILTERS = [{ name: "JSON", extensions: ["json"] }];

export async function exportData(): Promise<{ saved: boolean }> {
  const filePath = await pickSaveFile({
    title: "Export data", filters: FILTERS,
    defaultName: `${brand.packageName}-data-${new Date().toISOString().slice(0, 10)}.json`,
  });
  if (!filePath || !getWindow()) return { saved: false };
  const collections = Object.fromEntries(names.map((n) => [n, collection(n).list()])) as Record<CollectionName, unknown[]>;
  await writeFile(filePath, JSON.stringify(buildBundle(getSettings(), collections), null, 2));
  return { saved: true };
}

/** Replaces only the collections the file contains and applies only the settings it contains. */
export async function importData(): Promise<{ imported: boolean; counts: Record<string, number> }> {
  const path = await pickOpenFile({ title: "Import data", filters: FILTERS });
  if (!path || !getWindow()) return { imported: false, counts: {} };
  if ((await stat(path)).size > MAX_IMPORT_BYTES) throw new Error("That file is too large to be an export from this app.");
  let raw: unknown;
  try { raw = JSON.parse(await readFile(path, "utf8")); } catch { raw = null; }
  if (!getWindow()) return { imported: false, counts: {} };
  const bundle = healBundle(raw);
  if (!bundle) throw new Error(`That file is not an export from ${brand.name}.`);
  const present = names.filter((n) => bundle.collections[n] !== undefined);
  // list() throws for a collection saved by a newer version: refuse before anything is replaced.
  for (const n of present) collection(n).list();
  const counts: Record<string, number> = {};
  for (const n of present) {
    collection(n).replaceAll(bundle.collections[n]);
    counts[n] = collection(n).list().length;
  }
  updateSettings(bundle.settings);
  return { imported: true, counts };
}

/**
 * Data reset: every collection, the settings, the recent files and the cached news are deleted; each change is
 * pushed to the renderer by the listeners. The window position and the log files are kept on purpose.
 */
export function resetData(): void {
  for (const n of names) collection(n).clear();
  resetSettings();
  clearRecents();
  clearNewsCache();
}
