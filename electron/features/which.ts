// Finds a program on PATH as an absolute file, so a spawn never searches the current folder (CWE-427).
import { accessSync, constants, existsSync } from "node:fs";
import { resolveOnPath } from "./launchCore";

export function isExecutable(file: string): boolean {
  try {
    if (process.platform === "win32") return existsSync(file);
    accessSync(file, constants.X_OK);
    return true;
  } catch { return false; }
}

/** The absolute file `command` runs as, from the absolute PATH entries only, or null. */
export function which(command: string): string | null {
  const pathVar = process.env.PATH ?? process.env.Path ?? "";
  return resolveOnPath(command, pathVar, isExecutable, process.platform, process.env.PATHEXT);
}
