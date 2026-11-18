import { app, dialog, type FileFilter } from "electron";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join } from "node:path";
import type { OpenedFile } from "../../shared/ipc/editor";
import { getWindow } from "../window";
import { deliverDeepLink } from "./deepLink";
import { homeDir } from "./home";
import { EDITOR_MAX_BYTES, HandleTable, decodeText, displayFolder, isTextFileName, safeFileName } from "./filesCore";
import { log } from "./logger";
import { addRecent } from "./recents";

// The only place that turns a path into a handle: the renderer holds random ids, never paths.
const handles = new HandleTable(200, () => randomBytes(8).toString("hex"));
let pending: string | null = null;

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

/** Throws "Too large" or "Not a text file". The size is checked before the file is read. */
export function readTextFile(path: string, maxBytes: number): string {
  const st = statSync(path);
  if (!st.isFile()) throw new Error("Not a text file");
  if (st.size > maxBytes) throw new Error("Too large");
  return decodeText(readFileSync(path), maxBytes);
}

/** Temp file in the same folder, then rename, so a crash never leaves half a document. */
export function writeTextFile(path: string, text: string): void {
  if (!isAbsolute(path)) throw new Error("Not a file path");
  const tmp = `${path}.${randomBytes(4).toString("hex")}.tmp`;
  // Keep the document's own permissions (owner-only for a new file); "wx" never follows an existing temp path.
  let mode = 0o600;
  try { mode = statSync(path).mode & 0o777; } catch { /* new file */ }
  try {
    writeFileSync(tmp, text, { encoding: "utf8", mode, flag: "wx" });
    renameSync(tmp, path);
  } catch (e) {
    try { rmSync(tmp, { force: true }); } catch { /* ignore */ }
    throw e;
  }
}

export const fileHandle = (path: string): string => handles.handle(path);
export const pathOf = (fileId: string): string | null => handles.pathOf(fileId);

/** .md .markdown .txt up to 2 MB; adds a recent. */
export function openTextFile(path: string): OpenedFile {
  const name = basename(path);
  if (!isTextFileName(name)) throw new Error("Not a text file");
  const text = readTextFile(path, EDITOR_MAX_BYTES);
  addRecent(path);
  return { fileId: fileHandle(path), name, folder: displayFolder(path, homeDir()), text };
}

/** A file named on the command line (launch, second instance, macOS open-file): held for the Editor and announced. */
export function queueLaunchFile(path: string): void {
  pending = path;
  deliverDeepLink({ view: "app", appId: "editor" });
}

export function takePendingFile(): OpenedFile | null {
  const path = pending;
  pending = null;
  if (!path) return null;
  try {
    return openTextFile(path);
  } catch (e) {
    log.warn("files", "Could not open the launch file", e);
    return null;
  }
}
