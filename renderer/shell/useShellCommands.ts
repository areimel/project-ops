import { useEffect } from "react";
import type { CommandSpec } from "../../shared/commands";
import { APPS } from "../apps/registry";
import type { AppDefinition } from "../apps/types";
import { useAppEvent } from "../hooks/useAppEvent";
import { useSetting } from "../hooks/useSettings";
import { useShortcuts } from "../hooks/useShortcuts";
import { menuContext } from "./commandTable";
import type { HandlerRegistry } from "./handlerRegistry";
import { fire } from "./ipcSafe";
import type { RouterAction } from "./router";
import { nextMode } from "./shellModel";

interface Options {
  registry: HandlerRegistry;
  commands: readonly CommandSpec[];
  activeApp: AppDefinition | null;
  navigate(action: RouterAction): void;
  togglePalette(): void;
  toggleHelp(): void;
  /** False while a dialog owns the keyboard: neither keys nor menu accelerators run commands then. */
  commandsEnabled: boolean;
}

/**
 * Wires the one command table to its three inputs: renderer keys (`keys`), native menu clicks and accelerators
 * (`menu:command`), and the palette (which calls `registry.run`). Also tells the native menu which app is active.
 */
export function useShellCommands(o: Options): void {
  const { registry, commands, activeApp, navigate, togglePalette, toggleHelp } = o;
  const [mode, setMode] = useSetting("mode");

  useEffect(() => {
    const handlers: Record<string, () => void> = {
      "shell.settings": () => navigate({ type: "settings" }),
      "shell.home": () => navigate({ type: "home" }),
      "shell.palette": togglePalette,
      "shell.shortcuts": toggleHelp,
      "shell.cycleMode": () => setMode(nextMode(mode)),
      "shell.fullscreen": () => fire(() => window.app.invoke("window:toggle-fullscreen"), "Toggling fullscreen"),
    };
    for (const a of APPS) handlers[`go.${a.id}`] = () => navigate({ type: "open", appId: a.id });
    return registry.register(handlers);
  }, [registry, navigate, togglePalette, toggleHelp, mode, setMode]);

  useShortcuts(commands, registry.table, o.commandsEnabled);

  // The menu is built from the same table, but the page decides whether a command is live right now.
  // The same enabled check as the keys: an open dialog must not be bypassed by an accelerator such as Ctrl+O.
  useAppEvent("menu:command", (id) => {
    if (o.commandsEnabled && commands.some((c) => c.id === id)) registry.run(id);
  });

  useEffect(() => {
    fire(() => window.app.invoke("menu:set-context", menuContext(activeApp, APPS)), "Updating the menu");
  }, [activeApp]);
}
