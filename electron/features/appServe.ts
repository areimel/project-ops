// Serves the built renderer (dist-renderer) for the app scheme. No electron import, so tests can load it.
import { readFile, realpath, stat } from "node:fs/promises";
import { extname, join, sep } from "node:path";
import { APP_HOST } from "../../shared/csp";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".map": "application/json; charset=utf-8",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8",
};
export const mimeFor = (file: string): string => MIME[extname(file).toLowerCase()] ?? "application/octet-stream";

/** The URL path as plain segments, or null when it could climb out of the root or is not a plain path. "/" is index.html. */
export function segmentsOf(pathname: string): string[] | null {
  let decoded: string;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  if (/[\u0000-\u001f\\]/.test(decoded)) return null;
  const parts = decoded.split("/").filter((p) => p !== "");
  if (parts.some((p) => p === "." || p === "..")) return null;
  return parts.length === 0 ? ["index.html"] : parts;
}

/** The real path of an existing regular file inside `root` (a realpath), or null. A symlink that leaves the root is refused. */
export async function confinedFile(root: string, pathname: string): Promise<string | null> {
  const parts = segmentsOf(pathname);
  if (!parts) return null;
  try {
    const real = await realpath(join(root, ...parts));
    if (!real.startsWith(root.endsWith(sep) ? root : root + sep)) return null;
    return (await stat(real)).isFile() ? real : null;
  } catch {
    return null;
  }
}

const plain = (status: number, headers: Record<string, string> = {}): Response => new Response(null, { status, headers });

/** `root` must be a realpath. HTML responses carry the CSP header; every response is `nosniff`. */
export async function serveApp(root: string, rawUrl: string, method: string, csp: string): Promise<Response> {
  if (method !== "GET" && method !== "HEAD") return plain(405, { Allow: "GET, HEAD" });
  let url: URL;
  try { url = new URL(rawUrl); } catch { return plain(400); }
  if (url.hostname !== APP_HOST) return plain(404);
  const file = await confinedFile(root, url.pathname);
  if (!file) return plain(404);
  const type = mimeFor(file);
  const headers: Record<string, string> = { "Content-Type": type, "X-Content-Type-Options": "nosniff" };
  if (type.startsWith("text/html")) headers["Content-Security-Policy"] = csp;
  try {
    return new Response(method === "HEAD" ? null : new Uint8Array(await readFile(file)), { status: 200, headers });
  } catch {
    return plain(404);
  }
}
