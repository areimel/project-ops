import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { brand } from "../../shared/brand";
import { APPS } from "../apps/registry";
import { Spinner } from "../components/common/Spinner";
import { ToastHost, useToasts } from "../components/common/Toast";
import { useSetting } from "../hooks/useSettings";
import { useTheme } from "../theme/useTheme";
import { CREDITS } from "../utils/credits";
import { IS_MAC } from "../utils/platform";
import { CommandPalette } from "./CommandPalette";
import { ErrorBoundary } from "./ErrorBoundary";
import { ShellProvider, type ShellApi, type ShellInternals, type TitleInfo } from "./ShellContext";
import { ShortcutHelp } from "./ShortcutHelp";
import { TitleBar } from "./TitleBar";
import { TitleBlock } from "./TitleBlock";
import { activeCommands, hintFor, keyFor } from "./commandTable";
import { createHandlerRegistry } from "./handlerRegistry";
import { fire } from "./ipcSafe";
import { titleBlockModel } from "./shellModel";
import { useConfirm } from "./useConfirm";
import { useShellCommands } from "./useShellCommands";
import { useShellEvents } from "./useShellEvents";
import { useSettingsEscape } from "./useSettingsEscape";
import { useShellNav } from "./useShellNav";

const SettingsScreen = lazy(() => import("../settings/SettingsScreen").then((m) => ({ default: m.SettingsScreen })));

/** The frame: title bar, the app or Settings, and the footer with the title block. */
export function AppShell() {
  useTheme();
  const toasts = useToasts();
  const confirm = useConfirm();
  const { route, navigate, setGuard, guardMessage } = useShellNav(confirm.confirm);
  const [registry] = useState(createHandlerRegistry);
  const [titleInfo, setTitleInfo] = useState<TitleInfo | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mode] = useSetting("mode");

  const app = route.view === "app" ? APPS.find((a) => a.id === route.appId) ?? null : null;
  const commands = useMemo(() => activeCommands(app, APPS), [app]);
  const togglePalette = useCallback(() => setPaletteOpen((v) => !v), []);
  const toggleHelp = useCallback(() => setHelpOpen((v) => !v), []);

  useShellCommands({
    registry, commands, activeApp: app, navigate, togglePalette, toggleHelp,
    commandsEnabled: !paletteOpen && !helpOpen && !confirm.open,
  });
  useSettingsEscape(route.view === "settings" && !paletteOpen && !helpOpen && !confirm.open, () => navigate({ type: "home" }));
  useShellEvents({ navigate, confirm: confirm.confirm, guardMessage });

  const name = route.view === "settings" ? "Settings" : app?.name ?? brand.name;
  useEffect(() => { document.title = route.view === "settings" || app ? `${name} - ${brand.name}` : brand.name; }, [route.view, app, name]);

  const hintOf = useCallback((id: string) => hintFor(commands, id, IS_MAC), [commands]);
  const api = useMemo<ShellApi>(() => ({
    route, navigate, toast: toasts.push, confirm: confirm.confirm, hint: hintOf,
  }), [route, navigate, toasts.push, confirm.confirm, hintOf]);
  const internals = useMemo<ShellInternals>(() => ({ registry, setTitleInfo, setGuard }), [registry, setGuard]);

  const logError = (e: Error) => fire(() => window.app.invoke("log:write", "error", `${name}: ${e.stack ?? e.message}`.slice(0, 2000)), "Writing the log");
  const runnable = paletteOpen ? commands.filter((c) => registry.has(c.id)) : [];

  const Screen = app ? app.component : SettingsScreen;
  const content = (
    <ErrorBoundary resetKey={app?.id ?? "settings"} onError={logError}>
      <Suspense fallback={<Spinner label={`Loading ${name}`} />}><Screen /></Suspense>
    </ErrorBoundary>
  );

  return (
    <ShellProvider api={api} internals={internals}>
      <div className="shell" data-view={route.view}>
        <TitleBar
          name={name} mode={mode} hintOf={hintOf} paletteKey={keyFor(commands, "shell.palette")} onPalette={togglePalette}
          onCycleMode={() => registry.run("shell.cycleMode")} onSettings={() => navigate({ type: route.view === "settings" ? "home" : "settings" })}
          onHome={() => navigate({ type: "home" })} inSettings={route.view === "settings"}
        />
        <main className="shell-content" id="content">{content}</main>
        <footer className="shell-footer">
          <TitleBlock model={titleBlockModel(route, brand.name, name, titleInfo ?? {}, CREDITS.version)} />
        </footer>
        {paletteOpen && <CommandPalette commands={runnable} onRun={(id) => registry.run(id)} onClose={() => setPaletteOpen(false)} />}
        {helpOpen && <ShortcutHelp commands={commands} onClose={() => setHelpOpen(false)} />}
        {confirm.node}
        <ToastHost items={toasts.items} onDismiss={toasts.dismiss} />
      </div>
    </ShellProvider>
  );
}
