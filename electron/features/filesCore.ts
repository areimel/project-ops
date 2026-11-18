// Pure parts of files.ts (no electron import, so tests can load them).
import { dirname } from "node:path";

export const EDITOR_MAX_BYTES = 2 * 1024 * 1024;
export const TEXT_EXTENSIONS = [".md", ".markdown", ".txt"] as const;

export function isTextFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return TEXT_EXTENSIONS.some((e) => lower.endsWith(e));
}

/** Throws "Too large" or "Not a text file". Text means valid UTF-8 with no NUL bytes. */
export function decodeText(buf: Uint8Array, maxBytes: number): string {
  if (buf.byteLength > maxBytes) throw new Error("Too large");
  if (buf.includes(0)) throw new Error("Not a text file");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^﻿/, "");
  } catch {
    throw new Error("Not a text file");
  }
}

/**
 * A file name that is safe to hand a save dialog: the last path segment only, no control or reserved
 * characters, no leading/trailing dots or spaces, at most 120 characters. Falls back to `fallback`.
 */
export function safeFileName(raw: string, fallback = "Untitled.md"): string {
  const last = raw.split(/[\\/]/).pop() ?? "";
  const cleaned = last.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "_").replace(/^[.\s]+|[.\s]+$/g, "").slice(0, 120).trim();
  return cleaned === "" ? fallback : cleaned;
}

export const FOLDER_DISPLAY_MAX = 40;

/**
 * Shortens a folder path to `max` characters by dropping middle segments: `~/…/deep/leaf`. The first segment
 * and as many of the last ones as fit stay. A last segment that is itself too long is cut at its start.
 */
export function elideMiddle(dir: string, max = FOLDER_DISPLAY_MAX): string {
  if (dir.length <= max) return dir;
  const sep = dir.includes("/") ? "/" : "\\";
  const parts = dir.split(sep);
  const head = parts[0] === "" ? sep : `${parts[0]}${sep}`;   // "/" for an absolute path, "~/" or "C:\\" otherwise
  const tail: string[] = [];
  let used = head.length + 2;                                   // the head and "…" plus its separator
  for (let i = parts.length - 1; i > 0; i--) {
    const next = used + parts[i].length + 1;
    if (next > max && tail.length > 0) break;
    tail.unshift(parts[i]);
    used = next;
  }
  const rest = tail.join(sep);
  if (head.length + 2 + rest.length > max) return `…${rest.slice(-(max - 1))}`;
  return `${head}…${sep}${rest}`;
}

/**
 * Display-only folder text: the home directory shows as "~" and a long path is elided in the middle.
 * The renderer gets this short form, never the absolute path, and never sends it back.
 */
export function displayFolder(path: string, home: string): string {
  const dir = dirname(path);
  const short = home && (dir === home || dir.startsWith(`${home}/`) || dir.startsWith(`${home}\\`)) ? `~${dir.slice(home.length)}` : dir;
  return elideMiddle(short);
}

/** Bounded two-way map between random file ids and paths. The renderer only ever holds the id. */
export class HandleTable {
  private byId = new Map<string, string>();
  private byPath = new Map<string, string>();
  constructor(private max: number, private makeId: () => string) {}

  handle(path: string): string {
    const known = this.byPath.get(path);
    if (known) return known;
    const id = this.makeId();
    this.byId.set(id, path);
    this.byPath.set(path, id);
    if (this.byId.size > this.max) {
      const oldest = this.byId.keys().next().value as string;
      const oldPath = this.byId.get(oldest);
      this.byId.delete(oldest);
      if (oldPath !== undefined) this.byPath.delete(oldPath);
    }
    return id;
  }

  pathOf(id: string): string | null {
    return typeof id === "string" ? (this.byId.get(id) ?? null) : null;
  }
}
