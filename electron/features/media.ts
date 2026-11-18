import { protocol } from "electron";
import { randomBytes } from "node:crypto";
import { createReadStream, realpathSync, statSync } from "node:fs";
import { basename } from "node:path";
import { Readable } from "node:stream";
import { brand } from "../../shared/brand";
import type { MediaFile } from "../../shared/ipc/player";
import { isMediaExtension, mimeForName, UNSUPPORTED_MESSAGE } from "../../shared/mediaTypes";
import { parseRange } from "./mediaRange";

/**
 * How the sandboxed page plays a file it cannot read. The page gets a URL such as
 * app-template-media://file/<token>; this module answers it from disk. Exactly one file is
 * servable at a time, and the URL carries a random token, never the path.
 */
let served: { token: string; real: string } | null = null;

/** Registered with the other schemes in main.ts, before app ready. */
export const MEDIA_SCHEME_ENTRY: Electron.CustomScheme = {
  scheme: brand.mediaScheme, privileges: { standard: true, secure: true, stream: true },
};

/** Checks `path`, makes it the only servable file (replacing the previous one) and returns its URL. */
export function serveOnly(path: string): MediaFile {
  served = null;                                // a failed open must not leave the old file served
  const real = realpathSync(path);              // serve what was checked, not a symlink that can change
  if (!isMediaExtension(real)) throw new Error(UNSUPPORTED_MESSAGE);
  const st = statSync(real);
  if (!st.isFile()) throw new Error("That is not a file.");
  served = { token: randomBytes(16).toString("hex"), real };
  return { url: `${brand.mediaScheme}://file/${served.token}`, name: basename(real), sizeBytes: st.size };
}

export function clearServed(): void {
  served = null;
}

export function servedFileExists(): boolean {
  try { return served !== null && statSync(served.real).isFile(); } catch { return false; }
}

const reply = (status: number, headers: Record<string, string> = {}, body: ReadableStream | null = null) =>
  new Response(body, { status, headers });

function serveFile(rangeHeader: string | null): Response {
  if (!served) return reply(403);
  const { real } = served;
  let size: number;
  try { size = statSync(real).size; } catch { return reply(404); }   // vanished since it was opened

  const headers: Record<string, string> = { "Content-Type": mimeForName(real), "Accept-Ranges": "bytes" };
  const range = parseRange(rangeHeader, size);
  if (range === "unsatisfiable") return reply(416, { "Content-Range": `bytes */${size}` });
  if (size === 0) return reply(200, { ...headers, "Content-Length": "0" });

  const { start, end } = range ?? { start: 0, end: size - 1 };
  headers["Content-Length"] = String(end - start + 1);
  if (range) headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  const body = Readable.toWeb(createReadStream(real, { start, end })) as ReadableStream;
  return reply(range ? 206 : 200, headers, body);   // 206 lets the <video> seek without downloading everything
}

export function registerMediaProtocol(): void {     // after ready
  protocol.handle(brand.mediaScheme, (req) => {
    const url = new URL(req.url);
    if (req.method !== "GET" || url.hostname !== "file" || !served || url.pathname.slice(1) !== served.token) return reply(403);
    try { return serveFile(req.headers.get("range")); } catch { return reply(500); }
  });
}
