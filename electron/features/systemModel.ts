// Pure helpers for the System sheet: no electron import, so vitest can run them.

export interface CpuTimes { idle: number; total: number }

/** The shape of one entry of os.cpus(). */
interface CpuEntry { times: { user: number; nice: number; sys: number; idle: number; irq: number } }

/** Sums every core's time counters. They only ever grow, so two readings are needed for a percentage. */
export function cpuTimes(cpus: readonly CpuEntry[]): CpuTimes {
  let idle = 0;
  let total = 0;
  for (const { times } of cpus) {
    idle += times.idle;
    total += times.user + times.nice + times.sys + times.idle + times.irq;
  }
  return { idle, total };
}

/** Busy share of the time between two readings, 0 to 100. No time elapsed counts as 0. */
export function cpuPercent(prev: CpuTimes, next: CpuTimes): number {
  const total = next.total - prev.total;
  if (!(total > 0)) return 0;
  const busy = 1 - (next.idle - prev.idle) / total;
  return Math.min(100, Math.max(0, Math.round(busy * 1000) / 10));
}

export function osName(platform: string): string {
  switch (platform) {
    case "linux": return "Linux";
    case "darwin": return "macOS";
    case "win32": return "Windows";
    default: return platform;
  }
}

/** Load averages to two decimals; Windows reports zeros. */
export function roundLoad(load: readonly number[]): [number, number, number] {
  const r = (n: number | undefined): number => Math.round((n ?? 0) * 100) / 100;
  return [r(load[0]), r(load[1]), r(load[2])];
}
