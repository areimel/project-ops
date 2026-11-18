import { describe, expect, it } from "vitest";
import {
  EDITOR_IDS, EDITORS, TERMINAL_IDS, TERMINALS, isEditorId, isTerminalId, launchCommand, launchersFor,
  type LaunchPlatform,
} from "../../shared/launchers";

const DIR = "/home/someone/My Projects/a b";
const PLATFORMS: LaunchPlatform[] = ["linux", "darwin", "win32"];
const LINUX_EDITORS = ["vscode", "cursor", "zed", "sublime", "vscodium"];
const LINUX_TERMINALS = ["gnome-terminal", "ghostty", "konsole", "kitty", "alacritty", "wezterm"];

/** The folder is its own argv element, or the documented `--flag=<dir>` form; never inside a shell string. */
function carriesDir(args: string[]): boolean {
  return args.includes(DIR) || args.some((a) => /^--[a-z-]+=/.test(a) && a.slice(a.indexOf("=") + 1) === DIR);
}

describe("launcher table", () => {
  it("ids are unique and the guards match the table", () => {
    expect(new Set(EDITOR_IDS).size).toBe(EDITORS.length);
    expect(new Set(TERMINAL_IDS).size).toBe(TERMINALS.length);
    for (const id of EDITOR_IDS) expect(isEditorId(id)).toBe(true);
    for (const id of TERMINAL_IDS) expect(isTerminalId(id)).toBe(true);
    for (const x of ["code", "bash", "", null, 1, "vscode ", "__proto__", "toString"]) {
      expect(isEditorId(x)).toBe(false);
      expect(isTerminalId(x)).toBe(false);
    }
    expect(isTerminalId("vscode")).toBe(false);
    expect(isEditorId("kitty")).toBe(false);
  });

  it("every Linux editor and terminal resolves, with the folder as its own argument", () => {
    expect(launchersFor("editor", "linux").map((l) => l.id)).toEqual(LINUX_EDITORS);
    expect(launchersFor("terminal", "linux").map((l) => l.id)).toEqual(LINUX_TERMINALS);
    for (const id of LINUX_EDITORS) {
      const cmd = launchCommand("editor", id, "linux", DIR);
      expect(cmd?.args, id).toEqual([DIR]);
    }
    for (const id of LINUX_TERMINALS) {
      const cmd = launchCommand("terminal", id, "linux", DIR);
      expect(cmd, id).not.toBeNull();
      expect(carriesDir(cmd!.args), id).toBe(true);
    }
  });

  it("uses the documented commands on Linux", () => {
    expect(launchCommand("editor", "vscode", "linux", DIR)).toEqual({ command: "code", args: [DIR] });
    expect(launchCommand("editor", "sublime", "linux", DIR)?.command).toBe("subl");
    expect(launchCommand("editor", "vscodium", "linux", DIR)?.command).toBe("codium");
    expect(launchCommand("terminal", "gnome-terminal", "linux", DIR)).toEqual({ command: "gnome-terminal", args: [`--working-directory=${DIR}`] });
    expect(launchCommand("terminal", "ghostty", "linux", DIR)).toEqual({ command: "ghostty", args: [`--working-directory=${DIR}`] });
    expect(launchCommand("terminal", "konsole", "linux", DIR)).toEqual({ command: "konsole", args: ["--workdir", DIR] });
    expect(launchCommand("terminal", "kitty", "linux", DIR)).toEqual({ command: "kitty", args: ["--directory", DIR] });
    expect(launchCommand("terminal", "alacritty", "linux", DIR)).toEqual({ command: "alacritty", args: ["--working-directory", DIR] });
    expect(launchCommand("terminal", "wezterm", "linux", DIR)).toEqual({ command: "wezterm", args: ["start", "--cwd", DIR] });
  });

  it("every entry on every platform carries the folder", () => {
    for (const p of PLATFORMS) {
      for (const l of launchersFor("editor", p)) expect(carriesDir(launchCommand("editor", l.id, p, DIR)!.args), `${p} ${l.id}`).toBe(true);
      for (const l of launchersFor("terminal", p)) expect(carriesDir(launchCommand("terminal", l.id, p, DIR)!.args), `${p} ${l.id}`).toBe(true);
    }
  });

  it("unknown ids, the wrong kind and missing platform entries give null", () => {
    expect(launchCommand("editor", "notepad", "linux", DIR)).toBeNull();
    expect(launchCommand("editor", "kitty", "linux", DIR)).toBeNull();
    expect(launchCommand("terminal", "vscode", "linux", DIR)).toBeNull();
    expect(launchCommand("terminal", "konsole", "win32", DIR)).toBeNull();
    expect(launchCommand("editor", "__proto__", "linux", DIR)).toBeNull();
  });
});
