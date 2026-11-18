import { app, type BrowserWindow } from "electron";
import os from "node:os";
import { emit } from "../ipc/handle";
import { getWindow } from "../window";
import { cpuPercent, cpuTimes, osName, roundLoad, type CpuTimes } from "./systemModel";
import type { SystemInfo, SystemSample } from "../../shared/ipc/system";

const INTERVAL_MS = 1000;

/** Static facts. Deliberately no host name, user name, paths, addresses or environment. */
export function getSystemInfo(): SystemInfo {
  const cpus = os.cpus();
  return {
    os: osName(process.platform), release: os.release(), arch: process.arch,
    cpuModel: cpus[0]?.model.trim() ?? "Unknown", cores: cpus.length, totalMemBytes: os.totalmem(),
    versions: { app: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome, node: process.versions.node },
  };
}

let last: CpuTimes = cpuTimes(os.cpus());

function sample(): SystemSample {
  const now = cpuTimes(os.cpus());
  const cpu = cpuPercent(last, now);
  last = now;
  const total = os.totalmem();
  // Working set of every Electron process (main, renderer, GPU), reported in KB.
  const appKb = app.getAppMetrics().reduce((sum, m) => sum + m.memory.workingSetSize, 0);
  return {
    at: Date.now(), cpuPercent: cpu, memUsedBytes: total - os.freemem(), memTotalBytes: total,
    appMemBytes: appKb * 1024, uptimeSec: os.uptime(), loadAvg: roundLoad(os.loadavg()),
  };
}

// Sampling runs only while the renderer is subscribed AND the window is on screen.
let subscribed = false;
let timer: NodeJS.Timeout | null = null;
let watched: BrowserWindow | null = null;

const WINDOW_EVENTS = ["show", "hide", "minimize", "restore", "closed"] as const;

function shouldRun(): boolean {
  const w = getWindow();
  return subscribed && !!w && w.isVisible() && !w.isMinimized();
}

function sync(): void {
  const run = shouldRun();
  if (run && !timer) {
    last = cpuTimes(os.cpus());                     // fresh baseline: the first push covers one interval
    timer = setInterval(() => emit("system:sample", sample()), INTERVAL_MS);
  } else if (!run && timer) {
    clearInterval(timer);
    timer = null;
  }
}

function onWindowEvent(): void {
  if (!getWindow()) subscribed = false;             // closed: forget the subscription
  sync();
}

// A reload discards the page without running its cleanup, so it counts as an unsubscribe.
function onNavigate(d: { isMainFrame: boolean; isSameDocument: boolean }): void {
  if (d.isMainFrame && !d.isSameDocument) unsubscribe();
}

function unwatch(): void {
  if (!watched) return;
  if (!watched.isDestroyed()) {
    for (const name of WINDOW_EVENTS) watched.removeListener(name as "show", onWindowEvent);
    watched.webContents.removeListener("did-start-navigation", onNavigate);
  }
  watched = null;
}

/** Returns a first sample (its CPU value is 0: there is no earlier reading); pushes follow every second. */
export function subscribe(): SystemSample {
  const w = getWindow();
  if (w && watched !== w) {
    unwatch();
    watched = w;
    for (const name of WINDOW_EVENTS) w.on(name as "show", onWindowEvent);
    w.webContents.on("did-start-navigation", onNavigate);
  }
  subscribed = true;
  sync();
  return sample();
}

export function unsubscribe(): void {
  subscribed = false;
  sync();
  unwatch();
}
