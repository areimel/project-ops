// Reads git facts by running the git binary with fixed arguments. Never throws: any failure gives nulls.
import { execFile, type ChildProcess } from "node:child_process";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { parseCommitTime, parseStatus, remoteToHttps } from "./gitInfoCore";

export interface GitInfo {
  branch: string | null;
  lastCommitAt: number | null;
  dirty: boolean | null;
  repoUrl: string | null;
}

const TIMEOUT_MS = 5000;
const MAX_BUFFER = 1024 * 1024;
const running = new Set<ChildProcess>();

/** stdout, or null on any failure (no git, not a repo, timeout, too much output, non-zero exit). */
function git(path: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const child = execFile(
        "git", ["--no-optional-locks", "-c", "core.fsmonitor=false", "-C", path, ...args],
        {
          timeout: TIMEOUT_MS, maxBuffer: MAX_BUFFER, windowsHide: true, encoding: "utf8",
          env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_OPTIONAL_LOCKS: "0" },
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

/** Skips git when the folder has no `.git` entry. Three sequential calls, so one repo uses one process at a time. */
export async function readGitInfo(path: string): Promise<GitInfo> {
  const none: GitInfo = { branch: null, lastCommitAt: null, dirty: null, repoUrl: null };
  try {
    await stat(join(path, ".git"));
  } catch {
    return none;
  }
  const status = await git(path, ["status", "--porcelain=v2", "--branch"]);
  const log = await git(path, ["log", "-1", "--format=%ct"]);
  const remote = await git(path, ["config", "--get", "remote.origin.url"]);
  const parsed = status === null ? null : parseStatus(status);
  return {
    branch: parsed?.branch ?? null,
    dirty: parsed?.dirty ?? null,
    lastCommitAt: log === null ? null : parseCommitTime(log),
    repoUrl: remote === null ? null : remoteToHttps(remote),
  };
}

/** `readGitInfo` over many folders, four at a time. */
export const readGitInfos = (paths: readonly string[]): Promise<GitInfo[]> => mapLimit(paths, 4, readGitInfo);
