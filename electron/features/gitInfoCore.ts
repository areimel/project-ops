// Pure parsers for git output and remote URLs.
import { healLink } from "../../shared/projects/record";

/** Git facts for one folder; every field null when it is not a repo or git could not be used. */
export interface GitInfo {
  branch: string | null;
  lastCommitAt: number | null;
  dirty: boolean | null;
  repoUrl: string | null;
}

/** From `git status --porcelain=v2 --branch`. Detached HEAD gives a null branch; any non-header line is a change. */
export function parseStatus(porcelainV2: string): { branch: string | null; dirty: boolean } {
  let branch: string | null = null;
  let dirty = false;
  for (const line of porcelainV2.split(/\r?\n/)) {
    if (line === "") continue;
    if (line.startsWith("# ")) {
      if (line.startsWith("# branch.head ")) {
        const head = line.slice("# branch.head ".length).trim();
        branch = head === "" || head === "(detached)" ? null : head;
      }
    } else dirty = true;
  }
  return { branch, dirty };
}

/** From `git log -1 --format=%ct`: seconds to ms, null for empty or non-numeric output (a repo with no commits). */
export function parseCommitTime(stdout: string): number | null {
  const s = stdout.trim();
  if (!/^\d{1,12}$/.test(s)) return null;
  return Number(s) * 1000;
}

/**
 * An origin URL as a plain https web URL, credentials and `.git` stripped, or null. Accepts scp-style
 * `git@host:user/repo.git`, `ssh://`, `git://` and `https://` remotes. `http:`, `file:`, local paths and
 * anything healLink refuses give null. The result always passes healLink.
 */
export function remoteToHttps(remote: string): string | null {
  const s = remote.trim();
  if (s === "" || s.length > 2048 || /[\s\x00-\x1f]/.test(s)) return null;
  let host: string;
  let path: string;
  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(s);
  if (scheme) {
    const proto = scheme[1]!.toLowerCase();
    if (!["https", "ssh", "git"].includes(proto)) return null;
    let url: URL;
    try { url = new URL(s); } catch { return null; }
    host = proto === "https" ? url.host : url.hostname;   // keep a port only for https
    path = url.pathname;
  } else {
    const m = /^(?:[\w.-]+@)?([\w.-]{2,}):(?!\/\/)(.+)$/.exec(s);   // 2+ chars keeps `C:\repo` out
    if (!m) return null;
    host = m[1]!;
    path = m[2]!;
  }
  path = path.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\.git$/i, "");
  if (host === "" || path === "" || path.split("/").some((p) => p === "." || p === "..")) return null;
  return healLink(`https://${host}/${path}`);
}

// Local config keys that make git run a program (or pull in more config that could). A scanned folder may hold a
// repository the owner did not create, so when any of these is set no git command runs in it (gitInfo.ts reads
// HEAD and config from disk instead). Matched case-insensitively on the names `git config --list --name-only` prints.
const RISKY_KEYS: readonly RegExp[] = [
  /^filter\./,                                   // clean, smudge, process
  /^diff\.external$/, /^diff\..+\.(textconv|command)$/,
  /^merge\..+\.driver$/,
  /^core\.(fsmonitor|hookspath|sshcommand|editor|pager|askpass|gitproxy|attributesfile)$/,
  /^sequence\.editor$/,
  /^credential\./,
  /^gpg\./,                                      // gpg.program, gpg.<format>.program
  /^log\.showsignature$/,
  /^alias\./,
  /^pager\./,
  /^include\.path$/, /^includeif\./,             // pull in further config
  /(command|textconv|program|helper|editor|pager|askpass|driver|hook|hookspath|fsmonitor)$/,   // any other *command key
];

/** The names in `names` (one per line of `config --local --list --name-only`) that are risky, lower-cased, in order. */
export function riskyConfigKeys(names: readonly string[]): string[] {
  const out: string[] = [];
  for (const raw of names) {
    const name = raw.trim().toLowerCase();
    if (name !== "" && RISKY_KEYS.some((re) => re.test(name))) out.push(name);
  }
  return out;
}

/** The branch from a `.git/HEAD` file: `ref: refs/heads/<name>` gives the name; a bare hash or anything else, null. */
export function parseHeadFile(text: string): string | null {
  const m = /^ref:\s*refs\/heads\/(\S+)\s*$/.exec(text.split(/\r?\n/)[0] ?? "");
  if (!m) return null;
  const name = m[1]!;
  return name.length > 255 || /[\x00-\x1f\x7f]/.test(name) ? null : name;
}

/** `url` of `[remote "origin"]` in a `.git/config` file (raw, unconverted), or null. Section and key names ignore case. */
export function parseOriginUrl(text: string): string | null {
  let inOrigin = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#") || line.startsWith(";")) continue;
    const section = /^\[\s*([A-Za-z0-9.-]+)(?:\s+"((?:[^"\\]|\\.)*)")?\s*\]/.exec(line);
    if (section) {
      inOrigin = section[1]!.toLowerCase() === "remote" && section[2] === "origin";
      continue;
    }
    if (!inOrigin) continue;
    const kv = /^([A-Za-z][A-Za-z0-9-]*)\s*=\s*(.*)$/.exec(line);
    if (kv && kv[1]!.toLowerCase() === "url") {
      let value = kv[2]!.replace(/\s+[#;].*$/, "").trim();
      if (value.length >= 2 && value.startsWith("\"") && value.endsWith("\"")) value = value.slice(1, -1);
      return value === "" ? null : value;
    }
  }
  return null;
}
