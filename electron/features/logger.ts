import { app } from "electron";
import { appendFileSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { brand } from "../../shared/brand";

// userData/logs/main.log, rotates at 1 MB to main.old.log; console in dev. Logging never throws.
type Level = "info" | "warn" | "error";
type Log = (scope: string, msg: string, extra?: unknown) => void;

const MAX_BYTES = 1024 * 1024;
const MAX_LINE = 4000;
const RANK: Record<Level, number> = { info: 0, warn: 1, error: 2 };

let dir: string | null = null;
let size = 0;

function minLevel(): Level {
  const v = process.env[`${brand.envPrefix}_LOG_LEVEL`];
  return v === "warn" || v === "error" ? v : "info";
}

function describe(extra: unknown): string {
  if (extra === undefined) return "";
  if (extra instanceof Error) return ` ${extra.stack ?? extra.message}`;
  try { return ` ${typeof extra === "string" ? extra : JSON.stringify(extra)}`; } catch { return " [unserialisable]"; }
}

function ensureDir(): string {
  if (dir) return dir;
  const d = join(app.getPath("userData"), "logs");
  mkdirSync(d, { recursive: true });
  try { size = statSync(join(d, "main.log")).size; } catch { size = 0; }
  dir = d;
  return d;
}

function write(level: Level, scope: string, msg: string, extra?: unknown): void {
  if (RANK[level] < RANK[minLevel()]) return;
  const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} [${scope}] ${msg}${describe(extra)}`.slice(0, MAX_LINE);
  if (!app.isPackaged) (level === "info" ? console.log : level === "warn" ? console.warn : console.error)(line);
  try {
    const d = ensureDir();
    const file = join(d, "main.log");
    if (size >= MAX_BYTES) {
      const old = join(d, "main.old.log");
      rmSync(old, { force: true });
      renameSync(file, old);
      size = 0;
    }
    appendFileSync(file, `${line}\n`);
    size += Buffer.byteLength(line) + 1;
  } catch { /* a full disk or a read-only profile must not take the app down */ }
}

const at = (level: Level): Log => (scope, msg, extra) => write(level, scope, msg, extra);
export const log: { info: Log; warn: Log; error: Log } = { info: at("info"), warn: at("warn"), error: at("error") };
