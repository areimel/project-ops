import { net } from "electron";
import { NET_MAX_BYTES, NetError, isAllowedUrl, parseBody, readCapped, toNetError } from "./netCore";

export { NET_HOSTS, NetError, isAllowedUrl } from "./netCore";

/**
 * GET a JSON document from an allowlisted https host through the main process. Redirects are refused,
 * the body is capped at 2 MB, and every failure is a NetError with a fixed message (never a raw error).
 */
export async function fetchJson<T>(url: string, heal: (raw: unknown) => T, o?: { timeoutMs?: number }): Promise<T> {
  if (!isAllowedUrl(url)) throw new NetError("blocked", "That address is not allowed");
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, o?.timeoutMs ?? 10_000);
  try {
    const res = await net.fetch(url, { signal: ctrl.signal, redirect: "error", credentials: "omit" });
    if (!res.ok) throw new NetError("http", `The server answered with status ${res.status}`);
    const length = Number(res.headers.get("content-length"));
    if (Number.isFinite(length) && length > NET_MAX_BYTES) throw new NetError("parse", "Response too large");
    return parseBody(await readCapped(res.body, NET_MAX_BYTES), heal);
  } catch (e) {
    throw toNetError(e, timedOut);
  } finally {
    clearTimeout(timer);
  }
}
