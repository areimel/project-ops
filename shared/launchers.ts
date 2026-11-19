// The fixed table of code editors and terminals a project can be opened in. Pure data: the page names an
// id, main looks it up here, and the folder is passed as its own argv element (spawn with shell: false).
// No string from the page ever becomes a command.
//
// Linux entries are the ones in use. macOS (`open -a <App> <dir>`) and Windows entries are best-effort
// and untested.

export type LaunchPlatform = "linux" | "darwin" | "win32";
export type LauncherKind = "editor" | "terminal";

export interface LaunchCommand { command: string; args: string[] }
type Builder = (dir: string) => LaunchCommand;

export interface Launcher<Id extends string = string> {
  id: Id;
  label: string;
  platforms: Partial<Record<LaunchPlatform, Builder>>;
}

const run = (command: string, ...before: string[]): Builder => (dir) => ({ command, args: [...before, dir] });
const mac = (app: string): Builder => run("open", "-a", app);    // untested

const EDITOR_TABLE = [
  { id: "vscode", label: "VS Code", platforms: { linux: run("code"), darwin: mac("Visual Studio Code"), win32: run("code.cmd") } },
  { id: "cursor", label: "Cursor", platforms: { linux: run("cursor"), darwin: mac("Cursor"), win32: run("cursor.cmd") } },
  { id: "zed", label: "Zed", platforms: { linux: run("zed"), darwin: mac("Zed"), win32: run("zed") } },
  { id: "sublime", label: "Sublime Text", platforms: { linux: run("subl"), darwin: mac("Sublime Text"), win32: run("subl") } },
  { id: "vscodium", label: "VSCodium", platforms: { linux: run("codium"), darwin: mac("VSCodium"), win32: run("codium.cmd") } },
] as const satisfies readonly Launcher[];

const TERMINAL_TABLE = [
  {
    id: "gnome-terminal", label: "GNOME Terminal",
    platforms: { linux: (dir: string) => ({ command: "gnome-terminal", args: [`--working-directory=${dir}`] }) },
  },
  {
    id: "ghostty", label: "Ghostty",
    platforms: { linux: (dir: string) => ({ command: "ghostty", args: [`--working-directory=${dir}`] }), darwin: mac("Ghostty") },
  },
  { id: "konsole", label: "Konsole", platforms: { linux: run("konsole", "--workdir") } },
  { id: "kitty", label: "Kitty", platforms: { linux: run("kitty", "--directory"), darwin: mac("kitty") } },
  {
    id: "alacritty", label: "Alacritty",
    platforms: { linux: run("alacritty", "--working-directory"), darwin: mac("Alacritty"), win32: run("alacritty", "--working-directory") },
  },
  {
    id: "wezterm", label: "WezTerm",
    platforms: { linux: run("wezterm", "start", "--cwd"), darwin: mac("WezTerm"), win32: run("wezterm", "start", "--cwd") },
  },
  { id: "windows-terminal", label: "Windows Terminal", platforms: { win32: run("wt", "-d") } },        // untested
  { id: "macos-terminal", label: "Terminal", platforms: { darwin: mac("Terminal") } },                // untested
] as const satisfies readonly Launcher[];

export type EditorId = (typeof EDITOR_TABLE)[number]["id"];
export type TerminalId = (typeof TERMINAL_TABLE)[number]["id"];

export const EDITORS: readonly Launcher<EditorId>[] = EDITOR_TABLE;
export const TERMINALS: readonly Launcher<TerminalId>[] = TERMINAL_TABLE;
export const EDITOR_IDS: readonly EditorId[] = EDITORS.map((l) => l.id);
export const TERMINAL_IDS: readonly TerminalId[] = TERMINALS.map((l) => l.id);

export const isEditorId = (x: unknown): x is EditorId => EDITOR_IDS.includes(x as EditorId);
export const isTerminalId = (x: unknown): x is TerminalId => TERMINAL_IDS.includes(x as TerminalId);

/** The table for a kind: EDITORS or TERMINALS. */
export const launcherTable = (kind: LauncherKind): readonly Launcher[] => (kind === "editor" ? EDITORS : TERMINALS);

/** The detected ids of one kind from an `{ editors, terminals }` pair (as `projects:launchers` returns it). */
export const installedFor = (
  kind: LauncherKind, installed: { editors: readonly string[]; terminals: readonly string[] },
): readonly string[] => (kind === "editor" ? installed.editors : installed.terminals);

/** The table entry for an id of that kind, or undefined. */
export function findLauncher(kind: LauncherKind, id: unknown): Launcher | undefined {
  return launcherTable(kind).find((l) => l.id === id);
}

/** Entries that have a command on `platform`, in table order (for pickers and PATH lookup). */
export function launchersFor(kind: LauncherKind, platform: LaunchPlatform): Launcher[] {
  return launcherTable(kind).filter((l) => l.platforms[platform] !== undefined);
}

/** The argv to spawn, or null for an unknown id or one with no entry on `platform`. */
export function launchCommand(kind: LauncherKind, id: unknown, platform: LaunchPlatform, path: string): LaunchCommand | null {
  const build = findLauncher(kind, id)?.platforms[platform];
  return build ? build(path) : null;
}
