// Pure: builds the native menu template from the command table and the renderer's MenuContext.
// Imports electron types only, so tests can load it. menu.ts turns the result into a real Menu.
import type { MenuItemConstructorOptions } from "electron";
import {
  COMMAND_ID, SHELL_COMMANDS, goCommands, toAccelerator,
  type CommandSpec, type MenuContext,
} from "../shared/commands";
import { brand, type LinkKey } from "../shared/brand";
import { IpcArgError } from "./ipc/validate";

export const MAX_APPS = 20;
export const MAX_APP_COMMANDS = 30;
export const MAX_LABEL = 60;
const APP_ID = /^[a-z][a-z0-9-]{0,31}$/;
/** Accelerators the renderer may send in `accelerator`: the shape of toAccelerator output for chords. */
export const ACCELERATOR = /^((CmdOrCtrl|Ctrl|Alt|Shift)\+){0,3}([A-Z0-9,./]|F\d{1,2})$/;
/** toAccelerator output for named keys (keys: ["Delete"], [" "], ["ArrowLeft"]), with optional modifiers. */
const NAMED_ACCELERATOR = /^((CmdOrCtrl|Ctrl|Alt|Shift)\+){0,3}(Space|Left|Right|Up|Down|Delete|Backspace|Enter|Escape|Tab|Home|End|PageUp|PageDown)$/;

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const label = (x: unknown): string | null =>
  typeof x === "string" && x.trim() !== "" && x.length <= MAX_LABEL && !/[\u0000-\u001f\u007f]/.test(x) ? x : null;

function command(raw: unknown): CommandSpec | null {
  if (!isRecord(raw)) return null;
  const { id, group } = raw;
  const text = label(raw.label);
  if (typeof id !== "string" || !COMMAND_ID.test(id) || id.length > 64 || !text || label(group) === null) return null;
  const out: { -readonly [K in keyof CommandSpec]: CommandSpec[K] } = { id, label: text, group: group as string };
  if (typeof raw.accelerator === "string" && ACCELERATOR.test(raw.accelerator)) out.accelerator = raw.accelerator;
  if (Array.isArray(raw.keys)) {
    const keys = raw.keys.filter((k): k is string => typeof k === "string" && k.length > 0 && k.length <= 24).slice(0, 4);
    if (keys.length) out.keys = keys;
  }
  if (raw.menu === false) out.menu = false;
  return out;
}

/**
 * Validates the renderer's menu:set-context. Malformed structure throws; individual bad items are dropped
 * and counts are capped, so a confused renderer can shrink the menu but never put odd text or keys into it.
 */
export function sanitizeMenuContext(raw: unknown, at = "#1"): MenuContext {
  if (!isRecord(raw) || !Array.isArray(raw.apps)) throw new IpcArgError(at, "a menu context");
  const apps: MenuContext["apps"] = [];
  for (const a of raw.apps.slice(0, MAX_APPS)) {
    if (!isRecord(a) || typeof a.id !== "string" || !APP_ID.test(a.id)) continue;
    const name = label(a.name);
    if (name) apps.push({ id: a.id, name });
  }
  let app: MenuContext["app"] = null;
  if (raw.app !== null && raw.app !== undefined) {
    if (!isRecord(raw.app) || !Array.isArray(raw.app.commands)) throw new IpcArgError(at, "a menu context");
    const name = label(raw.app.name);
    if (name) {
      const commands = raw.app.commands.slice(0, MAX_APP_COMMANDS).map(command).filter((c): c is CommandSpec => c !== null);
      app = { name, commands };
    }
  }
  return { apps, app };
}

/** The accelerator a command shows in the menu, and whether the menu itself should fire on it. */
export function menuAccelerator(c: CommandSpec): { accelerator: string; registerAccelerator: boolean } | null {
  if (c.accelerator && ACCELERATOR.test(c.accelerator)) return { accelerator: c.accelerator, registerAccelerator: true };
  const key = c.keys?.[0];
  const acc = key ? toAccelerator(key) : undefined;
  // Renderer-handled keys are display only: the page already handles them, so the menu must not fire a second time.
  if (acc && (ACCELERATOR.test(acc) || NAMED_ACCELERATOR.test(acc))) return { accelerator: acc, registerAccelerator: false };
  return null;
}

export interface MenuEnv {
  mac: boolean;
  dev: boolean;
  context: MenuContext;
  send(commandId: string): void;
  openLink(key: LinkKey): void;
}

const LINK_ITEMS: ReadonlyArray<[LinkKey, string]> = [["website", "Website"], ["issues", "Report an issue"], ["source", "Source code"]];

export function buildTemplate(env: MenuEnv): MenuItemConstructorOptions[] {
  const used = new Set<string>();
  const item = (c: CommandSpec): MenuItemConstructorOptions => {
    const acc = menuAccelerator(c);
    const o: MenuItemConstructorOptions = { label: c.label, click: () => env.send(c.id) };
    if (acc && !used.has(acc.accelerator)) {
      used.add(acc.accelerator);
      o.accelerator = acc.accelerator;
      o.registerAccelerator = acc.registerAccelerator;
    }
    return o;
  };
  const items = (list: readonly CommandSpec[]): MenuItemConstructorOptions[] => list.filter((c) => c.menu !== false).map(item);

  const shell = SHELL_COMMANDS.filter((c) => c.menu !== false);
  const fromGroup = (g: string): MenuItemConstructorOptions[] => items(shell.filter((c) => c.group === g));
  const sep: MenuItemConstructorOptions = { type: "separator" };

  const fileItems = fromGroup("File");
  const file = [...fileItems, ...(fileItems.length ? [sep] : []), env.mac ? { role: "close" as const } : { role: "quit" as const }];
  const view: MenuItemConstructorOptions[] = [
    ...fromGroup("View"),
    ...(env.dev ? [sep, { role: "reload" as const }, { role: "forceReload" as const }, { role: "toggleDevTools" as const }] : []),
  ];
  const go = [...fromGroup("Go"), ...(env.context.apps.length ? [sep] : []), ...items(goCommands(env.context.apps))];
  const helpItems = fromGroup("Help");
  const help: MenuItemConstructorOptions[] = [
    ...helpItems, ...(helpItems.length ? [sep] : []),
    ...LINK_ITEMS.map(([key, text]): MenuItemConstructorOptions => ({ label: text, click: () => env.openLink(key) })),
    ...(env.mac ? [] : [sep, { role: "about" as const, label: `About ${brand.name}` }]),
  ];

  const app = env.context.app;
  const appMenu: MenuItemConstructorOptions[] = app ? [{ label: app.name, submenu: items(app.commands) }] : [];

  return [
    ...(env.mac ? [{ role: "appMenu" as const }] : []),
    { label: "File", submenu: file },
    { role: "editMenu" },
    { label: "View", submenu: view },
    { label: "Go", submenu: go },
    ...appMenu,
    { role: "windowMenu" },
    { label: "Help", role: "help", submenu: help },
  ];
}
