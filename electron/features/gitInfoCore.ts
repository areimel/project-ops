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

// Whether git may run in a folder at all. A scanned folder may hold a repository the owner did not create, and its
// config can name programs git runs (filters, fsmonitor, hooks, textconv, aliases, includes, worktree config ...).
// Rather than refuse known-bad keys, git runs only when EVERY key in .git/config is on a short list of plain data
// keys; anything unknown, including keys added by future git versions, means "not plain" and no git process.

export interface ConfigEntry {
  key: string;            // `section.key` or `section.subsection.key`; section and key lower-cased, subsection kept
  value: string | null;   // null for a bare key (boolean true)
}

/** A value after `=`: quotes, escapes and an unquoted `#`/`;` comment. Null when unterminated or continued. */
function parseValue(raw: string): string | null {
  let out = "";
  let quoted = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]!;
    if (c === "\\") {
      const next = raw[i + 1];
      if (next === undefined) return null;               // line continuation: refused rather than interpreted
      const map: Record<string, string> = { "\\": "\\", "\"": "\"", n: "\n", t: "\t", b: "\b" };
      if (!(next in map)) return null;
      out += map[next];
      i++;
    } else if (c === "\"") quoted = !quoted;
    else if (!quoted && (c === "#" || c === ";")) break;
    else out += c;
  }
  return quoted ? null : out.trim();
}

/**
 * The entries of a git config file, in order, or null when any line is not plainly understood (unknown syntax,
 * a continuation line, an unterminated quote, a key before any section). Strict on purpose: when in doubt, the
 * caller treats the repository as not plain.
 */
export function configEntries(text: string): ConfigEntry[] | null {
  const out: ConfigEntry[] = [];
  let section: string | null = null;
  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (line.startsWith("[")) {
      const m = /^\[\s*([A-Za-z0-9.-]+)\s*(?:"((?:[^"\\]|\\.)*)")?\s*\]/.exec(line);
      if (!m) return null;
      const name = m[1]!.toLowerCase();
      if (m[2] !== undefined) section = `${name}.${m[2].replace(/\\(.)/g, "$1")}`;
      else {
        const dot = name.indexOf(".");            // deprecated [section.sub]: the subsection is case-insensitive
        section = dot < 0 ? name : `${name.slice(0, dot)}.${name.slice(dot + 1)}`;
      }
      line = line.slice(m[0].length).trim();      // git allows `[core] key = value` on the header line
    }
    if (line === "" || line.startsWith("#") || line.startsWith(";")) continue;
    if (section === null) return null;
    const kv = /^([A-Za-z][A-Za-z0-9-]*)\s*(?:=(.*))?$/.exec(line);
    if (!kv) return null;
    const value = kv[2] === undefined ? null : parseValue(kv[2]);
    if (kv[2] !== undefined && value === null) return null;
    out.push({ key: `${section}.${kv[1]!.toLowerCase()}`, value });
  }
  return out;
}

/** The key names of a config file (see configEntries), or null when it cannot be parsed. */
export function configKeys(text: string): string[] | null {
  return configEntries(text)?.map((e) => e.key) ?? null;
}

// Plain data keys: [section, keys without a subsection, keys with a subsection].
//
// core.hooksPath names a folder of programs, yet it is allowed: every git call passes `-c core.hooksPath=/dev/null`,
// and a command-line `-c` (the "command" scope) wins over the repository's own config, so the repo's value is never
// used; besides, the only commands run (status, log -1, config --get) run no hooks at all.
// branch.<name>.github-pr-base-branch is written by the gh CLI: plain data.
const ALLOWED: Record<string, { plain?: readonly string[]; sub?: readonly string[] }> = {
  core: { plain: ["repositoryformatversion", "filemode", "bare", "logallrefupdates", "ignorecase", "precomposeunicode", "symlinks", "autocrlf", "eol", "safecrlf", "hookspath"] },
  remote: { sub: ["url", "fetch", "pushurl", "tagopt", "prune", "gh-resolved"] },
  branch: { sub: ["remote", "merge", "rebase", "description", "pushremote", "vscode-merge-base", "github-pr-owner-number", "github-pr-base-branch"] },
  user: { plain: ["name", "email"] },
  pull: { plain: ["rebase", "ff"] },
  push: { plain: ["default", "autosetupremote"] },
  init: { plain: ["defaultbranch"] },
  submodule: { sub: ["url", "active", "update"] },
  lfs: { plain: ["repositoryformatversion", "url"], sub: ["access"] },
};

function isAllowedKey(key: string): boolean {
  const first = key.indexOf(".");
  const last = key.lastIndexOf(".");
  if (first < 0) return false;
  const rule = ALLOWED[key.slice(0, first)];
  const name = key.slice(last + 1);
  if (!rule) return false;
  return first === last ? (rule.plain ?? []).includes(name) : (rule.sub ?? []).includes(name);
}

/** The keys that are not on the plain-data allowlist, in order (for the log line). */
export function disallowedKeys(keys: readonly string[]): string[] {
  return keys.filter((k) => !isAllowedKey(k));
}

/** True only when every key is on the plain-data allowlist (so `extensions.*`, `include.*`, `filter.*` ... are not). */
export function isPlainRepoConfig(keys: readonly string[]): boolean {
  return disallowedKeys(keys).length === 0;
}

const isUrlKey = (key: string): boolean =>
  /^remote\..+\.(url|pushurl)$/.test(key) || /^submodule\..+\.url$/.test(key) || key === "lfs.url";

/** Values of allowlisted keys that still matter: format version 0 only, no `!cmd` submodule update, no transport helpers. */
export function plainConfigValues(entries: readonly ConfigEntry[]): boolean {
  return entries.every(({ key, value }) => {
    if (key === "core.repositoryformatversion") return value !== null && value.trim() === "0";
    if (/^submodule\..+\.update$/.test(key)) return value === null || !value.trim().startsWith("!");
    if (isUrlKey(key)) return value === null || !value.includes("::");   // ext::, fd:: and other <helper>::<address>
    return true;
  });
}

/** A whole .git/config text: parseable, every key allowlisted, every checked value plain. */
export function isPlainConfigText(text: string): boolean {
  const entries = configEntries(text);
  return entries !== null && isPlainRepoConfig(entries.map((e) => e.key)) && plainConfigValues(entries);
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
