/**
 * Single source of truth for user commands. The shell commands live here; each app contributes its own
 * through its AppDefinition (renderer/apps/types.ts). Consumed by the renderer shortcut dispatcher, the
 * native menu, button tooltips, the command palette and the shortcut-help overlay.
 */
export interface CommandSpec {
  id: string;                 // "shell.palette" | "go.notes" | "<appId>.<name>", e.g. "notes.new"
  label: string;              // sentence case: "New note"
  group: string;              // heading in menu, palette and help: "View", "Notes"
  keys?: readonly string[];   // renderer-handled plain keys: "n", "Shift+E", "?", "Delete", " "
  accelerator?: string;       // menu-handled: "CmdOrCtrl+K"; the menu sends menu:command
  menu?: boolean;             // in the native menu (default true)
  palette?: boolean;          // in the command palette (default true)
}
export const COMMAND_ID = /^[a-z][a-z0-9-]*\.[a-zA-Z0-9-]+$/;
export const SHELL_GROUPS = ["File", "View", "Go", "Help"] as const;
export const SHELL_COMMANDS: readonly CommandSpec[] = [
  { id: "shell.settings", label: "Open settings", group: "File", accelerator: "CmdOrCtrl+," },
  { id: "shell.palette", label: "Command palette", group: "View", accelerator: "CmdOrCtrl+K" },
  { id: "shell.cycleMode", label: "Switch light or dark mode", group: "View", accelerator: "CmdOrCtrl+Shift+L" },
  { id: "shell.fullscreen", label: "Fullscreen", group: "View", accelerator: "F11" },
  { id: "shell.home", label: "Go to home", group: "Go", accelerator: "CmdOrCtrl+Shift+H" },
  { id: "shell.shortcuts", label: "Keyboard shortcuts", group: "Help", keys: ["?"] },
];

/** "go.<id>" commands, CmdOrCtrl+1..9 by registry order. Used by the renderer and by main's Go menu. */
export function goCommands(apps: readonly { id: string; name: string }[]): CommandSpec[] {
  return apps.slice(0, 9).map((a, i) => ({
    id: `go.${a.id}`, label: `Go to ${a.name}`, group: "Go", accelerator: `CmdOrCtrl+${i + 1}`,
  }));
}

export interface MenuContext {
  apps: { id: string; name: string }[];                         // registry order, <= 20
  app: { name: string; commands: CommandSpec[] } | null;        // active app, <= 30 commands
}

export function keysOf(c: CommandSpec): string[] {
  return c.keys?.length ? [...c.keys] : c.accelerator ? [c.accelerator] : [];
}

const KEY_NAMES: Record<string, [string, string]> = {
  " ": ["Space", "Space"],
  ArrowLeft: ["←", "←"],
  ArrowRight: ["→", "→"],
  ArrowUp: ["↑", "↑"],
  ArrowDown: ["↓", "↓"],
};
const MODS: Record<string, [string, string]> = {
  CmdOrCtrl: ["Ctrl", "⌘"],
  Cmd: ["Ctrl", "⌘"],
  Ctrl: ["Ctrl", "⌃"],
  Shift: ["Shift", "⇧"],
  Alt: ["Alt", "⌥"],
};

/** Splits "CmdOrCtrl+Shift+O" / "Shift+E" / "+" into modifiers and the final key. */
export function parseKey(key: string): { mods: string[]; key: string } {
  const parts = key.length > 1 ? key.split("+") : [key];
  let last = parts.pop() ?? "";
  if (last === "" && parts.length) last = "+"; // trailing "+" key
  return { mods: parts.filter(Boolean), key: last };
}

/** Human label for a key or accelerator, e.g. "CmdOrCtrl+O" -> "Ctrl+O" / "⌘O". */
export function formatKey(key: string, mac: boolean): string {
  const i = mac ? 1 : 0;
  const p = parseKey(key);
  const main = KEY_NAMES[p.key]?.[i] ?? (p.key.length === 1 ? p.key.toUpperCase() : p.key);
  const mods = p.mods.map((m) => MODS[m]?.[i] ?? m);
  return mac ? [...mods, main].join("") : [...mods, main].join("+");
}

/** Converts a renderer key to an Electron accelerator, or undefined if it has no sensible form. */
export function toAccelerator(key: string): string | undefined {
  if (key === "?") return "Shift+/";
  const { mods, key: k } = parseKey(key);
  const map: Record<string, string> = { " ": "Space", ArrowLeft: "Left", ArrowRight: "Right", ArrowUp: "Up", ArrowDown: "Down" };
  const main = map[k] ?? (k.length === 1 ? k.toUpperCase() : k);
  return [...mods, main].join("+");
}

/** Tooltip text: "New note (N)". Prefers the first key, else the accelerator. */
export function hint(c: CommandSpec, mac: boolean): string {
  const k = keysOf(c)[0];
  return k ? `${c.label} (${formatKey(k, mac)})` : c.label;
}
