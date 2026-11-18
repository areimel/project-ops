// Pure parts of net.ts (no electron import, so tests can load them).
export const NET_HOSTS = ["hacker-news.firebaseio.com"] as const;
export const NET_MAX_BYTES = 2 * 1024 * 1024;

export type NetErrorKind = "offline" | "timeout" | "http" | "blocked" | "parse";
export class NetError extends Error {
  constructor(public kind: NetErrorKind, message?: string) { super(message ?? kind); this.name = "NetError"; }
}

/** https only, host on the allowlist, default port, no credentials in the URL. */
export function isAllowedUrl(url: string): boolean {
  let u: URL;
  try { u = new URL(url); } catch { return false; }
  return u.protocol === "https:" && u.port === "" && u.username === "" && u.password === ""
    && (NET_HOSTS as readonly string[]).includes(u.hostname);
}

/** Reads a body stream as UTF-8 text and stops at maxBytes. */
export async function readCapped(body: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<string> {
  if (!body) return "";
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new NetError("parse", "Response too large");
      chunks.push(value);
    }
  } finally {
    void reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** JSON.parse then heal; any failure becomes a NetError("parse") with a fixed message. */
export function parseBody<T>(text: string, heal: (raw: unknown) => T): T {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new NetError("parse", "The server sent data that is not JSON"); }
  try { return heal(raw); } catch { throw new NetError("parse", "The server sent data in an unexpected shape"); }
}

/** Maps anything thrown by fetch or body reading to a NetError with a fixed, safe message. */
export function toNetError(e: unknown, timedOut: boolean): NetError {
  if (e instanceof NetError) return e;
  if (timedOut) return new NetError("timeout", "The request timed out");
  return new NetError("offline", "Could not reach the server");
}
