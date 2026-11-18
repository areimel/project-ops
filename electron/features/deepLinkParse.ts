import { isAbsolute, resolve } from "node:path";
import { brand } from "../../shared/brand";
import { isRecordId } from "../../shared/collections/base";
import type { DeepLink } from "../../shared/ipc/app";

// app-template://home | app-template://settings | app-template://open/<appId>[/<recordId>]
const APP_ID = /^[a-z][a-z0-9-]{0,31}$/;
const MAX_URL = 200;
const URL_SHAPE = /^([A-Za-z][A-Za-z0-9+.-]*):\/\/([A-Za-z]+)((?:\/[^/?#\s]+){0,3})\/?$/;

/** Strict: anything that is not exactly one of the three forms (query, fragment, extra segments, odd ids) is null. */
export function parseDeepLink(url: string): DeepLink | null {
  if (typeof url !== "string" || url.length > MAX_URL) return null;
  const m = URL_SHAPE.exec(url);
  if (!m || m[1].toLowerCase() !== brand.scheme) return null;
  const host = m[2].toLowerCase();
  const segments = m[3].split("/").slice(1);
  if (host === "home" || host === "settings") return segments.length === 0 ? { view: host } : null;
  if (host !== "open" || segments.length < 1 || segments.length > 2) return null;
  const [appId, recordId] = segments;
  if (!APP_ID.test(appId)) return null;
  if (recordId === undefined) return { view: "app", appId };
  return isRecordId(recordId) ? { view: "app", appId, recordId } : null;
}

const TEXT_FILE = /\.(md|markdown|txt)$/i;
/** Anything shaped like a URL (`scheme:` followed by `//`, or our own scheme) is never a file path. */
const URL_LIKE = /^[A-Za-z][A-Za-z0-9+.-]*:(\/\/|[^\\/])/;

/** What a launch or second-instance command line asks for: the first deep link and the first text file. */
export function argvTargets(argv: readonly string[], cwd: string): { link: DeepLink | null; file: string | null } {
  let link: DeepLink | null = null;
  let file: string | null = null;
  for (const arg of argv.slice(1)) {
    if (typeof arg !== "string") continue;
    if (arg === "--") break;
    if (arg.startsWith("-")) continue;
    // A Windows drive path (`C:\notes.md`) is a file; every other `scheme:` argument is a URL and stops here.
    if (URL_LIKE.test(arg) && !isAbsolute(arg)) {
      if (!link) link = parseDeepLink(arg);
      continue;
    }
    if (!file && TEXT_FILE.test(arg)) file = isAbsolute(arg) ? arg : resolve(cwd, arg);
  }
  return { link, file };
}
