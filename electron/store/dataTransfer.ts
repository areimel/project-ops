// Export / import / reset of the whole bundle. The dialogs are the shared helpers in features/files.ts.
import { readFile, stat, writeFile } from "node:fs/promises";
import { brand } from "../../shared/brand";
import { pickOpenFile, pickSaveFile } from "../features/files";
import { getWindow } from "../window";
import { invalidateScan } from "../features/projectsScanRun";
import { applyCollections, buildBundle, clearCollections, exportCollections, healBundle, type BundleCollection } from "./bundle";
import { projectsStore, rootsStore } from "./projects";
import { projectSpec, rootSpec } from "../../shared/projects";
import { resourceLinkSpec } from "../../shared/resources/links";
import { resourceLinksStore } from "./resources";
import { getSettings, resetSettings, updateSettings } from "./settings";

const targets = (): Record<string, BundleCollection> => ({
  [projectSpec.name]: projectsStore(), [rootSpec.name]: rootsStore(), [resourceLinkSpec.name]: resourceLinksStore(),
});

const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const FILTERS = [{ name: "JSON", extensions: ["json"] }];

export async function exportData(): Promise<{ saved: boolean }> {
  const filePath = await pickSaveFile({
    title: "Export data", filters: FILTERS,
    defaultName: `${brand.packageName}-data-${new Date().toISOString().slice(0, 10)}.json`,
  });
  if (!filePath || !getWindow()) return { saved: false };
  await writeFile(filePath, JSON.stringify(buildBundle(getSettings(), exportCollections(targets())), null, 2));
  return { saved: true };
}

/** Replaces only the settings and collections the file contains. The page is updated by the stores' own change pushes. */
export async function importData(): Promise<{ imported: boolean; counts: Record<string, number> }> {
  const path = await pickOpenFile({ title: "Import data", filters: FILTERS });
  if (!path || !getWindow()) return { imported: false, counts: {} };
  if ((await stat(path)).size > MAX_IMPORT_BYTES) throw new Error("That file is too large to be an export from this app.");
  let raw: unknown;
  try { raw = JSON.parse(await readFile(path, "utf8")); } catch { raw = null; }
  if (!getWindow()) return { imported: false, counts: {} };
  const bundle = healBundle(raw);
  if (!bundle) throw new Error(`That file is not an export from ${brand.name}.`);
  invalidateScan();   // a running scan must not write over what is imported
  // All or nothing: a newer-version collection refuses before any write; a failed write (or settings update)
  // puts back the collections already replaced, then throws.
  const counts = applyCollections(bundle, targets(), () => updateSettings(bundle.settings));
  return { imported: true, counts };
}

/**
 * Data reset: every collection (projects, scan folders, resource links) is cleared and the settings deleted; a running scan is dropped first; the change is pushed to the renderer by the listener. The window position and the log files are kept on purpose.
 */
export function resetData(): void {
  invalidateScan();
  clearCollections(targets());
  resetSettings();
}
