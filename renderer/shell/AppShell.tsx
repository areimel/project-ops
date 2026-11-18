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
import { Home } from "./Home";
import { Rail } from "./Rail";
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
import { useShellNav } from "./useShellNav";

const SettingsScreen = lazy(() => import("../settings/SettingsScreen").then((m) => ({ default: m.SettingsScreen })));

/** The frame: title bar, rail, the sheet that is open, and the footer with the title block. */
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

  const appIndex = route.view === "app" ? APPS.findIndex((a) => a.id === route.appId) : -1;
  const app = appIndex >= 0 ? APPS[appIndex] : null;
  const commands = useMemo(() => activeCommands(app, APPS), [app]);
  const togglePalette = useCallback(() => setPaletteOpen((v) => !v), []);
  const toggleHelp = useCallback(() => setHelpOpen((v) => !v), []);

  useShellCommands({
    registry, commands, activeApp: app, navigate, togglePalette, toggleHelp,
    commandsEnabled: !paletteOpen && !helpOpen && !confirm.open,
  });
  useShellEvents({ navigate, confirm: confirm.confirm, guardMessage });

  const name = app?.name ?? (route.view === "settings" ? "Settings" : "Sheet index");
  useEffect(() => { document.title = route.view === "home" ? brand.name : `${name} - ${brand.name}`; }, [route.view, name]);

  const hintOf = useCallback((id: string) => hintFor(commands, id, IS_MAC), [commands]);
  const api = useMemo<ShellApi>(() => ({
    route, sheet: appIndex >= 0 ? { index: appIndex, total: APPS.length } : null,
    navigate, toast: toasts.push, confirm: confirm.confirm, hint: hintOf,
  }), [route, appIndex, navigate, toasts.push, confirm.confirm, hintOf]);
  const internals = useMemo<ShellInternals>(() => ({ registry, setTitleInfo, setGuard }), [registry, setGuard]);

  const logError = (e: Error) => fire(() => window.app.invoke("log:write", "error", `${name}: ${e.stack ?? e.message}`.slice(0, 2000)), "Writing the log");
  const runnable = paletteOpen ? commands.filter((c) => registry.has(c.id)) : [];

  let content;
  if (route.view === "home") {
    content = <Home apps={APPS} onOpen={(appId) => navigate({ type: "open", appId })} />;
  } else {
    const Sheet = app ? app.component : SettingsScreen;
    content = (
      <ErrorBoundary resetKey={app?.id ?? "settings"} onError={logError}>
        <Suspense fallback={<Spinner label={`Loading ${name}`} />}><Sheet /></Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ShellProvider api={api} internals={internals}>
      <div className="shell" data-view={route.view}>
        <TitleBar
          name={name} mode={mode} hintOf={hintOf} paletteKey={keyFor(commands, "shell.palette")} onPalette={togglePalette}
          onCycleMode={() => registry.run("shell.cycleMode")} onSettings={() => navigate({ type: "settings" })}
        />
        {route.view !== "home" && <Rail apps={APPS} route={route} hintOf={hintOf} navigate={navigate} />}
        <main className="shell-content" id="content">{content}</main>
        <footer className="shell-footer">
          <TitleBlock model={titleBlockModel(route, brand.name, APPS.length, appIndex, titleInfo ?? {}, CREDITS.version)} />
        </footer>
        {paletteOpen && <CommandPalette commands={runnable} onRun={(id) => registry.run(id)} onClose={() => setPaletteOpen(false)} />}
        {helpOpen && <ShortcutHelp commands={commands} onClose={() => setHelpOpen(false)} />}
        {confirm.node}
        <ToastHost items={toasts.items} onDismiss={toasts.dismiss} />
      </div>
    </ShellProvider>
  );
}
