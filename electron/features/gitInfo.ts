// Reads git facts by running the git binary with fixed arguments. Never throws: any failure gives nulls.
//
// Scanned folders may hold repositories the owner did not create, and a repository's local config can name
// programs git runs (filters, fsmonitor, hooks, textconv, aliases, pagers, gpg, includes ...). So before any git
// process, .git/config is read from disk and git runs only when every key in it is known plain data (allowlist in
// gitInfoCore.ts) and there is no worktree config, common dir or submodule. Otherwise no git command runs in that
// repo: the branch and origin URL come from .git/HEAD and .git/config, and the last-commit time and dirty flag
// stay null. git itself is resolved to an absolute file once (never a bare name
// searched in the project folder).
import { execFile, type ChildProcess } from "node:child_process";
import { lstat } from "node:fs/promises";
import { join } from "node:path";
import { log } from "./logger";
import {
  type GitInfo, configKeys, disallowedKeys, isPlainConfigText, parseCommitTime, parseHeadFile, parseOriginUrl,
  parseStatus, remoteToHttps,
} from "./gitInfoCore";
import { readSmallFile } from "./smallFile";
import { which } from "./which";

export type { GitInfo };

const TIMEOUT_MS = 5000;
const MAX_BUFFER = 1024 * 1024;
const GIT_FILE_MAX = 64 * 1024;   // .git/HEAD and .git/config read from disk
const running = new Set<ChildProcess>();
const NONE: GitInfo = { branch: null, lastCommitAt: null, dirty: null, repoUrl: null };

let gitPath: string | null | undefined;   // undefined = not looked up yet; null = not found (behave as "no git")

function gitBinary(): string | null {
  if (gitPath === undefined) {
    gitPath = which("git");
    if (!gitPath) log.warn("git", "git was not found on PATH; projects get no git info");
  }
  return gitPath;
}

// Neutralise what the user's own (global) config or the environment could add, on every call.
const SAFE_ARGS = [
  "--no-optional-locks",
  "-c", "core.fsmonitor=false", "-c", "core.untrackedCache=false",
  "-c", "core.hooksPath=/dev/null", "-c", "log.showSignature=false", "-c", "core.attributesFile=/dev/null",
  "-c", "diff.ignoreSubmodules=all", "-c", "status.submoduleSummary=false", "-c", "submodule.recurse=false",
];

/** stdout, or null on any failure (no git, not a repo, timeout, too much output, non-zero exit). */
function git(path: string, args: string[]): Promise<string | null> {
  const bin = gitBinary();
  if (!bin) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const child = execFile(
        bin, [...SAFE_ARGS, "-C", path, ...args],
        {
          timeout: TIMEOUT_MS, maxBuffer: MAX_BUFFER, windowsHide: true, encoding: "utf8", shell: false,
          env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_OPTIONAL_LOCKS: "0", GIT_CONFIG_NOSYSTEM: "1", GIT_ATTR_NOSYSTEM: "1" },
        },
        (err, stdout) => { running.delete(child); resolve(err ? null : stdout); },
      );
      running.add(child);
    } catch {
      resolve(null);
    }
  });
}

/** Kill every git child still running; call from the app's real shutdown path. */
export function killGitChildren(): void {
  for (const child of running) child.kill();
  running.clear();
}

/** Runs `fn` over `items`, at most `limit` at a time, results in input order. `fn` must not throw. */
export async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]!); }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * The risky path: facts from disk only, no git process. A `.git` that is a file (a worktree or submodule pointer to
 * another folder) gives no info rather than following the pointer.
 */
async function readFromDisk(dotGit: string, isDir: boolean): Promise<GitInfo> {
  if (!isDir) return NONE;
  const head = await readSmallFile(join(dotGit, "HEAD"), GIT_FILE_MAX);
  const config = await readSmallFile(join(dotGit, "config"), GIT_FILE_MAX);
  const origin = config === null ? null : parseOriginUrl(config);
  return {
    branch: head === null ? null : parseHeadFile(head),
    lastCommitAt: null,
    dirty: null,
    repoUrl: origin === null ? null : remoteToHttps(origin),
  };
}

const exists = (path: string): Promise<boolean> => lstat(path).then(() => true, () => false);

/**
 * Decided from disk, before any git process: a real `.git` folder whose config is entirely plain data (see
 * isPlainConfigText), with no worktree-scope config, no shared common dir and no submodules. Anything else is
 * not plain and gets no git command at all.
 */
async function plainRepo(path: string, dotGit: string): Promise<{ plain: boolean; reason: string }> {
  const config = await readSmallFile(join(dotGit, "config"), GIT_FILE_MAX);
  if (config === null) return { plain: false, reason: ".git/config is missing, unreadable or too large" };
  for (const name of ["config.worktree", "commondir", "modules"]) {
    if (await exists(join(dotGit, name))) return { plain: false, reason: `.git/${name} exists` };
  }
  if (await exists(join(path, ".gitmodules"))) return { plain: false, reason: "it has submodules" };
  if (!isPlainConfigText(config)) {
    const keys = configKeys(config);
    const odd = keys === null ? ["(unparseable)"] : disallowedKeys(keys);
    return { plain: false, reason: `its config is not plain (${odd.slice(0, 5).join(", ").replace(/[^\x20-\x7e]/g, "?") || "a value"})` };
  }
  return { plain: true, reason: "" };
}

/** Skips git when the folder has no `.git` entry. Sequential calls, so one repo uses one process at a time. */
export async function readGitInfo(path: string): Promise<GitInfo> {
  if (!gitBinary()) return NONE;
  const dotGit = join(path, ".git");
  let isDir: boolean;
  try {
    const st = await lstat(dotGit);
    if (!st.isDirectory() && !st.isFile()) return NONE;
    isDir = st.isDirectory();
  } catch {
    return NONE;
  }
  if (!isDir) return NONE;   // a `gitdir:` pointer (worktree, submodule): not followed, no git
  const { plain, reason } = await plainRepo(path, dotGit);
  if (!plain) {
    log.warn("git", `not running git in a project folder: ${reason}`);
    return readFromDisk(dotGit, isDir);
  }
  const status = await git(path, ["status", "--porcelain=v2", "--branch", "--ignore-submodules=all"]);
  const commit = await git(path, ["log", "-1", "--format=%ct", "--no-show-signature"]);
  const remote = await git(path, ["config", "--get", "remote.origin.url"]);
  const parsed = status === null ? null : parseStatus(status);
  return {
    branch: parsed?.branch ?? null,
    dirty: parsed?.dirty ?? null,
    lastCommitAt: commit === null ? null : parseCommitTime(commit),
    repoUrl: remote === null ? null : remoteToHttps(remote),
  };
}

/** `readGitInfo` over many folders, four at a time. */
export const readGitInfos = (paths: readonly string[]): Promise<GitInfo[]> => mapLimit(paths, 4, readGitInfo);
