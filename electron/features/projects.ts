// The projects feature: what electron/ipc/projects.ts calls. Records and roots hold real paths and stay in main;
// the page gets path-free views (toProjectView / toRootView with displayPath) and addresses records by id.
// Folders come only from the directory dialog (or the dev stand-in), always realpath'd and checked to be folders.
import { clipboard } from "electron";
import { realpath } from "node:fs/promises";
import type { InstalledLaunchers } from "../../shared/ipc/projects";
import { installedFor } from "../../shared/launchers";
import {
  applyProjectPatch, effectiveLinks, healProjectPatch, isNetworkPath, toProjectView, toProjectViews,
  type OpenTarget, type ProjectLinkKey, type ProjectRecord, type ProjectView, type RootView,
} from "../../shared/projects";
import { emit } from "../ipc/handle";
import { projectsStore, rootsStore } from "../store/projects";
import { getSettings } from "../store/settings";
import { getWindow } from "../window";
import { pickFolder } from "./files";
import { displayPath } from "./filesCore";
import { isDirectory } from "./fsUtil";
import { killGitChildren, readGitInfo } from "./gitInfo";
import { homeDir } from "./home";
import { installedLaunchers, launch, openFolder } from "./launch";
import { resolveLauncher } from "./launchCore";
import { openExternalHttps } from "./links";
import { log } from "./logger";
import { inspectFolder } from "./projectScan";
import { afterRootRemoved, newManualProject, scanFacts, toRootViews } from "./projectsCore";
import { invalidateScan, scanInBackground } from "./projectsScanRun";

export { scan } from "./projectsScanRun";

const display = (abs: string): string => displayPath(abs, homeDir());

function record(id: string): ProjectRecord {
  const rec = projectsStore().get(id);
  if (!rec) throw new Error("Not found");
  return rec;
}

/** A chosen folder as its real path; throws when it is gone, not a folder or on a network share (see isNetworkPath). */
async function realDir(picked: string): Promise<string> {
  let real: string;
  try { real = await realpath(picked); } catch { throw new Error("That folder could not be found."); }
  if (isNetworkPath(real)) throw new Error("Folders on a network share are not supported. Map the share to a drive letter first.");
  if (!(await isDirectory(real))) throw new Error("That is not a folder.");
  return real;
}

// ---- views and pushes

export const listViews = (): ProjectView[] => toProjectViews(projectsStore().list(), display);
export const rootViews = (): RootView[] => toRootViews(rootsStore().list(), projectsStore().list(), display);

let initialised = false;
let lastRoots = "";

function pushRoots(): void {
  const views = rootViews();
  const key = JSON.stringify(views);
  if (key === lastRoots) return;      // project changes that leave every count alone send nothing
  lastRoots = key;
  emit("projects:roots-changed", views);
}

/** Subscribes the page pushes to both stores, once. Call after app ready. */
export function initProjects(): void {
  if (initialised) return;
  initialised = true;
  try { lastRoots = JSON.stringify(rootViews()); } catch { /* a newer file: list() throws; pushes still subscribe */ }
  projectsStore().onChange(() => { emit("projects:changed", listViews()); pushRoots(); });
  rootsStore().onChange(() => pushRoots());
}

// ---- user edits

/** `raw` is untrusted: healed with healProjectPatch, so only user fields change. */
export function update(id: string, raw: unknown): ProjectView {
  const current = record(id);
  return toProjectView(projectsStore().update(id, applyProjectPatch(current, healProjectPatch(raw))), display);
}

/** A tombstone: the record stays (hidden) so a scan does not bring it back. */
export function remove(id: string): void {
  record(id);
  projectsStore().update(id, { hidden: true });
}

export function restore(id: string): void {
  record(id);
  projectsStore().update(id, { hidden: false });
}

/** Directory dialog; an already known folder is unhidden and its id returned. Null on cancel or a closed window. */
export async function addFolder(): Promise<{ id: string } | null> {
  const picked = await pickFolder({ title: "Add a project folder" });
  if (!picked || !getWindow()) return null;
  const path = await realDir(picked);
  const known = (): { id: string } | null => {
    const rec = projectsStore().list().find((r) => r.path === path);
    if (!rec) return null;
    if (rec.hidden) projectsStore().update(rec.id, { hidden: false });
    return { id: rec.id };
  };
  const existing = known();
  if (existing) return existing;
  const detected = await inspectFolder(path);
  const git = await readGitInfo(path);
  if (!getWindow()) return null;
  return known() ?? { id: projectsStore().create(newManualProject(path, detected, git, Date.now())).id };
}

/** Re-reads one folder (detected facts and git); a folder that is gone is marked missing. */
export async function refresh(id: string): Promise<void> {
  const { path } = record(id);
  const present = await isDirectory(path);
  const detected = present ? await inspectFolder(path) : null;
  const git = present ? await readGitInfo(path) : null;
  const current = projectsStore().get(id);
  if (!current || current.path !== path) return;   // removed or replaced while we read: nothing to update
  projectsStore().update(id, present && git
    ? { missing: false, scan: scanFacts(current.scan, detected, git, Date.now()) }
    : { missing: true });
}

// ---- roots

/** Directory dialog; a new root is stored, a known one reused; either way a scan starts in the background. */
export async function addRoot(): Promise<RootView | null> {
  const picked = await pickFolder({ title: "Add a folder of projects" });
  if (!picked || !getWindow()) return null;
  const path = await realDir(picked);
  const roots = rootsStore();
  const rec = roots.list().find((r) => r.path === path) ?? roots.create({ path });
  scanInBackground();
  return rootViews().find((v) => v.id === rec.id) ?? null;
}

/** The root goes; its projects and hidden tombstones stay with rootId null. A running scan is dropped. */
export function removeRoot(id: string): void {
  const roots = rootsStore();
  if (!roots.get(id)) throw new Error("Not found");
  invalidateScan();
  roots.remove(id);
  const projects = projectsStore();
  projects.replaceAll(afterRootRemoved(projects.list(), id, Date.now()));
}

// ---- opening

export async function open(id: string, target: OpenTarget): Promise<void> {
  const { path } = record(id);
  if (target === "folder") {
    await openFolder(path);
  } else {
    const chosen = resolveLauncher(target, getSettings()[target], installedFor(target, installedLaunchers()));
    if (!chosen) {
      throw new Error(target === "editor"
        ? "No code editor was found. Install one, then choose it in Settings."
        : "No terminal was found. Install one, then choose it in Settings.");
    }
    await launch(target, chosen, path);
  }
  markOpened(id, path);
}

/**
 * Records when a project was last opened (the dashboard's "Recent"). Not an edit, so updatedAt is kept. The open
 * already happened, so a record replaced meanwhile is skipped and a failed write is logged, not thrown.
 */
function markOpened(id: string, path: string): void {
  try {
    const projects = projectsStore();
    if (projects.get(id)?.path !== path) return;
    projects.update(id, { lastOpenedAt: Date.now() }, { keepUpdatedAt: true });
  } catch (e) {
    log.warn("projects", "could not record the open time", e);
  }
}

/** The URL is looked up in the record (the user's link, or the detected remote for repo), https only. */
export function openLink(id: string, key: ProjectLinkKey): void {
  const url = effectiveLinks(record(id))[key];
  if (!url) throw new Error("This project has no such link.");
  if (!openExternalHttps(url)) throw new Error("That link could not be opened.");
}

export function copyPath(id: string): void {
  clipboard.writeText(record(id).path);
}

export const launchers = (): InstalledLaunchers => installedLaunchers();

/** From the real shutdown path: stop any running scan and kill git children. */
export function shutdownProjects(): void {
  invalidateScan();
  killGitChildren();
}
