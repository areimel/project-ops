import { existsSync } from "node:fs";
import { basename } from "node:path";
import type { RecentView } from "../../shared/ipc/editor";
import { readJson, removeJson, writeJson } from "../store/jsonStore";
import { displayFolder } from "./filesCore";
import { homeDir } from "./home";
import { healRecents, recentId, withRecent, type RecentFile } from "./recentsShape";

const FILE = "recents.json";

function existing(): RecentFile[] {
  return readJson(FILE, healRecents).filter((r) => existsSync(r.path));
}

/** What the renderer may see: hashed id, file name, display-only folder. Never the path. */
export function listRecents(): RecentView[] {
  return existing().map((r) => ({ id: recentId(r.path), name: r.name, folder: displayFolder(r.path, homeDir()) }));
}

export function recentPath(id: string): string | null {
  return existing().find((r) => recentId(r.path) === id)?.path ?? null;
}

export function addRecent(path: string): void {
  writeJson(FILE, withRecent(existing(), path, basename(path), Date.now()));
}

/** Data reset: forget the recent files. */
export function clearRecents(): void {
  removeJson(FILE);
}
