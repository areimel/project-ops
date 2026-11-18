import { spawn } from "node:child_process";
import { realpath, stat } from "node:fs/promises";
import { basename } from "node:path";
import { app, shell } from "electron";
import { brand } from "../../shared/brand";
import {
  findLauncher, launchCommand, launchersFor,
  type EditorId, type LaunchPlatform, type LauncherKind, type TerminalId,
} from "../../shared/launchers";
import { log } from "./logger";
import { childEnv, isBundleName, isInside, launchError } from "./launchCore";
import { which } from "./which";

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

function detect(kind: LauncherKind, platform: LaunchPlatform): string[] {
  return launchersFor(kind, platform)
    .filter((l) => {
      const command = launchCommand(kind, l.id, platform, "/")?.command ?? "";
      // macOS entries run `open -a <App>`; "open" is always there, so the app itself cannot be checked cheaply.
      return which(command) !== null;
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

/** Dev only, never packaged: APP_LAUNCH_DRY=1 logs what would start instead of starting it. */
const dryRun = (): boolean => !app.isPackaged && process.env[`${brand.envPrefix}_LAUNCH_DRY`] === "1";

async function assertDir(dir: string): Promise<void> {
  let isDir = false;
  try { isDir = (await stat(dir)).isDirectory(); } catch { /* reported below */ }
  if (!isDir) throw new Error("Folder not found");
}

/** Open `dir` in the system file manager. shell.openPath reports failure as a message, turned into an Error here. */
export async function openFolder(dir: string): Promise<void> {
  await assertDir(dir);
  if (dryRun()) {
    log.info("launch", `[open-folder] ${dir}`);
    return;
  }
  // On macOS opening a bundle folder (Foo.app, X.framework ...) launches it; show it in its parent instead.
  if (process.platform === "darwin" && isBundleName(basename(dir))) {
    shell.showItemInFolder(dir);
    return;
  }
  const error = await shell.openPath(dir);
  if (error !== "") throw new Error(`The folder could not be opened: ${error}`);
}

/** Open `dir` in the editor or terminal `id`. Resolves once the program has started, rejects with a message. */
export async function launch(kind: LauncherKind, id: unknown, dir: string): Promise<void> {
  const platform = platformKey();
  const launcher = findLauncher(kind, id);
  if (!platform || !launcher) throw new Error("That program is not available.");
  const cmd = launchCommand(kind, id, platform, dir);
  if (!cmd) throw new Error(`${launcher.label} is not available on this system. Choose another in Settings.`);

  await assertDir(dir);
  // Spawn an absolute file found on the absolute PATH entries only, never a bare name: with cwd set to the project
  // folder, a bare name could run a program planted there (CWE-427). A program that lies inside the project
  // folder itself (a PATH entry pointing into it) is refused too.
  const program = which(cmd.command);
  if (!program) throw new Error(launchError(launcher.label, "ENOENT"));
  const realDir = await realpath(dir);
  const realProgram = await realpath(program).catch(() => program);
  if ([program, realProgram].some((p) => isInside(p, realDir, process.platform))) {
    log.warn("launch", `refused ${program}: inside the project folder`);
    throw new Error(`${launcher.label} resolves to a program inside this project folder, so it was not started.`);
  }

  if (dryRun()) {
    log.info("launch", `[launch] ${program} ${JSON.stringify(cmd.args)} cwd=${dir}`);
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(program, cmd.args, {
      cwd: dir,
      env: childEnv(process.env),
      detached: true,
      stdio: "ignore",
      shell: false,
      windowsHide: true,
    });
    child.once("error", (e: NodeJS.ErrnoException) => {
      log.warn("launch", `${program} failed: ${e.code ?? e.message}`);
      reject(new Error(launchError(launcher.label, e.code)));
    });
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}
