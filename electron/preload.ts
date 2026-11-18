import { contextBridge, ipcRenderer, webUtils } from "electron";
import { IPC } from "../shared/ipc";
import type { AppBridge } from "../shared/ipc/bridge";
import { isThemeId } from "../shared/theme";
import { brand } from "../shared/brand";

type Kind = "invoke" | "drop" | "event";
function spec(channel: unknown, kind: Kind): void {
  const s = typeof channel === "string" ? (IPC as Record<string, { kind: Kind } | undefined>)[channel] : undefined;
  if (!s || s.kind !== kind) throw new Error(`Not a ${kind} channel: ${String(channel)}`);
}

// Dropped files are resolved to paths here, in the isolated preload world, from real File objects.
// The page never passes path strings for drops. Non-Files are skipped; at most 32 paths.
function droppedPaths(files: unknown): string[] {
  const out: string[] = [];
  if (!Array.isArray(files)) return out;
  for (const f of files.slice(0, 32) as unknown[]) {
    if (!(f instanceof File)) continue;
    const path = webUtils.getPathForFile(f);
    if (path) out.push(path);
  }
  return out;
}

const PREFIX = /^Error invoking remote method '[^']*': (?:Error: )?/;
const rethrow = (e: unknown): never => { throw new Error((e instanceof Error ? e.message : String(e)).replace(PREFIX, "")); };

function initialTheme(): AppBridge["initialTheme"] {
  const arg = process.argv.find((a) => a.startsWith("--app-theme="))?.slice("--app-theme=".length) ?? "";
  const [theme, mode] = arg.split(":");
  return { theme: isThemeId(theme) ? theme : brand.defaultTheme, mode: mode === "light" ? "light" : "dark" };
}

const bridge: AppBridge = {
  invoke: (channel, ...args) => { spec(channel, "invoke"); return ipcRenderer.invoke(channel, ...args).catch(rethrow); },
  drop: (channel, files) => { spec(channel, "drop"); return ipcRenderer.invoke(channel, droppedPaths(files)).catch(rethrow); },
  on: (event, cb) => {
    spec(event, "event");
    const handler = (_e: unknown, payload: unknown) => (cb as (p: unknown) => void)(payload);
    ipcRenderer.on(event, handler);
    return () => { ipcRenderer.removeListener(event, handler); };
  },
  platform: process.platform as AppBridge["platform"],
  initialTheme: initialTheme(),
};

contextBridge.exposeInMainWorld("app", bridge);
