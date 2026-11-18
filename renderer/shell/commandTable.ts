import { SHELL_COMMANDS, SHELL_GROUPS, goCommands, hint, keysOf, type CommandSpec, type MenuContext } from "../../shared/commands";
import type { AppDefinition } from "../apps/types";

/** Pure: shell + go + active app commands, in that order. Feeds useShortcuts, the palette and ShortcutHelp. */
export function activeCommands(app: AppDefinition | null, apps: readonly AppDefinition[]): CommandSpec[] {
  return [...SHELL_COMMANDS, ...goCommands(apps), ...(app?.commands ?? [])];
}

/** What the renderer tells the native menu (`menu:set-context`): the Go entries and the active app's menu. */
export function menuContext(app: AppDefinition | null, apps: readonly AppDefinition[]): MenuContext {
  return {
    apps: apps.slice(0, 20).map((a) => ({ id: a.id, name: a.name })),
    app: app ? { name: app.name, commands: [...(app.commands ?? [])].slice(0, 30) } : null,
  };
}

/** Tooltip text for a command id ("Go to Notes (Ctrl+1)"); falls back to the id's label if unknown. */
export function hintFor(commands: readonly CommandSpec[], id: string, mac: boolean): string {
  const c = commands.find((x) => x.id === id);
  return c ? hint(c, mac) : id;
}

/** The first key or accelerator of a command id, as the table spells it ("CmdOrCtrl+K"), or undefined. */
export function keyFor(commands: readonly CommandSpec[], id: string): string | undefined {
  const c = commands.find((x) => x.id === id);
  return c ? keysOf(c)[0] : undefined;
}

export interface HelpGroup { name: string; rows: { id: string; label: string; keys: string[] }[] }

/** Commands that have a key or accelerator, grouped for the help overlay: shell groups first, then app groups. */
export function helpGroups(commands: readonly CommandSpec[]): HelpGroup[] {
  const order: string[] = [...SHELL_GROUPS];
  for (const c of commands) if (!order.includes(c.group)) order.push(c.group);
  return order
    .map((name) => ({
      name,
      rows: commands.filter((c) => c.group === name && keysOf(c).length).map((c) => ({ id: c.id, label: c.label, keys: keysOf(c) })),
    }))
    .filter((g) => g.rows.length);
}
