import { spawn } from "node:child_process";
import { accessSync, constants, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { app } from "electron";
import { brand } from "../../shared/brand";
import {
  findLauncher, launchCommand, launchersFor,
  type EditorId, type LaunchPlatform, type LauncherKind, type TerminalId,
} from "../../shared/launchers";
import { log } from "./logger";
import { childEnv, launchError, onPath } from "./launchCore";

// Opens a folder in an editor or terminal from the fixed table in shared/launchers.ts. The page never supplies
// a command or a path of its own; `id` is looked up in the table and `dir` is passed as one argv element with
// shell: false.
//
// Windows is untested. Node refuses to spawn .cmd/.bat files with shell: false (EINVAL since the 2024 security
// fix), so entries like code.cmd will most likely fail there with "could not be started". Making them work
// safely needs an explicit `cmd.exe /d /s /c` call with careful argument quoting; that is deliberately not done
// here rather than risk shell injection through a folder name.

const CACHE_MS = 30_000;
let cache: { at: number; value: { editors: EditorId[]; terminals: TerminalId[] } } | null = null;

const platformKey = (): LaunchPlatform | null =>
  process.platform === "linux" || process.platform === "darwin" || process.platform === "win32" ? process.platform : null;

function isExecutable(file: string): boolean {
  try {
    if (process.platform === "win32") return existsSync(file);
    accessSync(file, constants.X_OK);
    return true;
  } catch { return false; }
}

function detect(kind: LauncherKind, platform: LaunchPlatform): string[] {
  const pathVar = process.env.PATH ?? process.env.Path ?? "";
  return launchersFor(kind, platform)
    .filter((l) => {
      const command = launchCommand(kind, l.id, platform, "/")?.command ?? "";
      // macOS entries run `open -a <App>`; "open" is always there, so the app itself cannot be checked cheaply.
      return onPath(command, pathVar, isExecutable, platform, process.env.PATHEXT);
    })
    .map((l) => l.id);
}

/** The editors and terminals found on this machine, in table order. Cached for 30 s. */
export function installedLaunchers(): { editors: EditorId[]; terminals: TerminalId[] } {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const platform = platformKey();
  const value = platform
    ? { editors: detect("editor", platform) as EditorId[], terminals: detect("terminal", platform) as TerminalId[] }
    : { editors: [], terminals: [] };
  cache = { at: Date.now(), value };
  return value;
}

export function clearLauncherCache(): void {
  cache = null;
}

/** Open `dir` in the editor or terminal `id`. Resolves once the program has started, rejects with a message. */
export async function launch(kind: LauncherKind, id: unknown, dir: string): Promise<void> {
  const platform = platformKey();
  const launcher = findLauncher(kind, id);
  if (!platform || !launcher) throw new Error("That program is not available.");
  const cmd = launchCommand(kind, id, platform, dir);
  if (!cmd) throw new Error(`${launcher.label} is not available on this system. Choose another in Settings.`);

  let isDir = false;
  try { isDir = (await stat(dir)).isDirectory(); } catch { /* reported below */ }
  if (!isDir) throw new Error("Folder not found");

  if (!app.isPackaged && process.env[`${brand.envPrefix}_LAUNCH_DRY`] === "1") {
    log.info("launch", `[launch] ${cmd.command} ${JSON.stringify(cmd.args)} cwd=${dir}`);
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd.command, cmd.args, {
      cwd: dir,
      env: childEnv(process.env),
      detached: true,
      stdio: "ignore",
      shell: false,
      windowsHide: true,
    });
    child.once("error", (e: NodeJS.ErrnoException) => {
      log.warn("launch", `${cmd.command} failed: ${e.code ?? e.message}`);
      reject(new Error(launchError(launcher.label, e.code)));
    });
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}
