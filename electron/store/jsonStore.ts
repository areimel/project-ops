import { app } from "electron";
import { randomBytes } from "node:crypto";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Store names are fixed strings in this codebase; the pattern keeps a typo from escaping userData. */
const NAME = /^[a-z0-9-]+\.json$/;

function storePath(name: string): string {
  if (!NAME.test(name)) throw new Error(`Bad store name: ${name}`);
  return join(app.getPath("userData"), name);
}

/**
 * Reads `userData/<name>` and passes the parsed value (or undefined when the file is missing or not
 * JSON) through `heal`, so callers always get a well-formed value even from a hand-edited or stale file.
 */
export function readJson<T>(name: string, heal: (raw: unknown) => T): T {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(storePath(name), "utf8"));
  } catch {
    raw = undefined;
  }
  return heal(raw);
}

export type JsonRead = { status: "missing" } | { status: "unreadable"; error: unknown } | { status: "ok"; value: unknown };

/** Like readJson but says why there is nothing: no file, a file that cannot be read or parsed, or its parsed value. */
export function readJsonFile(name: string): JsonRead {
  let text: string;
  try {
    text = readFileSync(storePath(name), "utf8");
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ENOENT" ? { status: "missing" } : { status: "unreadable", error };
  }
  try {
    return { status: "ok", value: JSON.parse(text) };
  } catch (error) {
    return { status: "unreadable", error };
  }
}

/** Moves a file that cannot be understood aside (`<name>.unreadable-<timestamp>`) so a write never destroys it. Returns the new path. */
export function quarantineJson(name: string, now: number = Date.now()): string {
  const from = storePath(name);
  const to = `${from}.unreadable-${now}`;
  renameSync(from, to);
  return to;
}

/** Deletes `userData/<name>`; a missing file is fine. */
export function removeJson(name: string): void {
  rmSync(storePath(name), { force: true });
}

/**
 * Writes atomically (temp file + rename) so a crash mid-write never leaves a truncated file behind.
 * Persistence is non-fatal everywhere it is used: returns false instead of throwing.
 */
export function writeJson(name: string, value: unknown): boolean {
  const target = storePath(name);
  const tmp = `${target}.${randomBytes(4).toString("hex")}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(value));
    renameSync(tmp, target);
    return true;
  } catch {
    try { rmSync(tmp, { force: true }); } catch { /* leave the temp file; never let cleanup throw */ }
    return false;
  }
}
