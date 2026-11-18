import { event, invoke } from "./define";

/** Nothing here identifies the user or the machine: no host name, user name, paths or addresses. */
export interface SystemInfo { os: string; release: string; arch: string; cpuModel: string; cores: number;
  totalMemBytes: number; versions: { app: string; electron: string; chrome: string; node: string } }
export interface SystemSample { at: number; cpuPercent: number; memUsedBytes: number; memTotalBytes: number;
  appMemBytes: number; uptimeSec: number; loadAvg: [number, number, number] }

export const systemIpc = {
  "system:info": invoke<[], SystemInfo>(),
  "system:subscribe": invoke<[], SystemSample>(),        // answers with a first sample, then 1 s system:sample pushes
  "system:unsubscribe": invoke<[], void>(),
  "system:sample": event<SystemSample>(),
} as const;
