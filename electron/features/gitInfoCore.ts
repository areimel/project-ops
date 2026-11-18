// Pure parsers for git output and remote URLs.
import { healLink } from "../../shared/projects/record";

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
