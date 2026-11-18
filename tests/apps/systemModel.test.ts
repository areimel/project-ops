import { describe, expect, it } from "vitest";
import { cpuPercent, cpuTimes, osName, roundLoad } from "../../electron/features/systemModel";
import { formatPercent, formatUptime, fraction } from "../../renderer/apps/system/systemFormat";

const core = (user: number, idle: number) => ({ times: { user, nice: 0, sys: 0, idle, irq: 0 } });

describe("cpuTimes", () => {
  it("sums every core", () => {
    expect(cpuTimes([core(10, 90), core(20, 80)])).toEqual({ idle: 170, total: 200 });
  });
  it("is zero without cores", () => {
    expect(cpuTimes([])).toEqual({ idle: 0, total: 0 });
  });
});

describe("cpuPercent", () => {
  it("is the busy share between two readings", () => {
    expect(cpuPercent({ idle: 100, total: 200 }, { idle: 150, total: 300 })).toBe(50);
  });
  it("is 0 when no time passed or the counters went backwards", () => {
    expect(cpuPercent({ idle: 5, total: 10 }, { idle: 5, total: 10 })).toBe(0);
    expect(cpuPercent({ idle: 5, total: 10 }, { idle: 1, total: 4 })).toBe(0);
  });
  it("stays within 0 to 100", () => {
    expect(cpuPercent({ idle: 0, total: 0 }, { idle: 0, total: 100 })).toBe(100);
    expect(cpuPercent({ idle: 0, total: 0 }, { idle: 120, total: 100 })).toBe(0);
  });
  it("rounds to one decimal", () => {
    expect(cpuPercent({ idle: 0, total: 0 }, { idle: 2, total: 3 })).toBe(33.3);
  });
});

describe("osName and roundLoad", () => {
  it("names the known platforms and passes others through", () => {
    expect(osName("linux")).toBe("Linux");
    expect(osName("darwin")).toBe("macOS");
    expect(osName("win32")).toBe("Windows");
    expect(osName("freebsd")).toBe("freebsd");
  });
  it("rounds to two decimals and pads a short list", () => {
    expect(roundLoad([1.234, 0.005, 2])).toEqual([1.23, 0.01, 2]);
    expect(roundLoad([])).toEqual([0, 0, 0]);
  });
});

describe("formatUptime", () => {
  it("picks the two largest units", () => {
    expect(formatUptime(0)).toBe("0 min");
    expect(formatUptime(59)).toBe("0 min");
    expect(formatUptime(185)).toBe("3 min");
    expect(formatUptime(3600 * 2 + 300)).toBe("2 h 05 min");
    expect(formatUptime(86400 * 4 + 3600 * 6 + 600)).toBe("4 d 6 h");
  });
  it("treats bad input as 0", () => {
    expect(formatUptime(-5)).toBe("0 min");
    expect(formatUptime(Number.NaN)).toBe("0 min");
  });
});

describe("fraction and formatPercent", () => {
  it("clamps and guards a zero total", () => {
    expect(fraction(5, 10)).toBe(0.5);
    expect(fraction(20, 10)).toBe(1);
    expect(fraction(-1, 10)).toBe(0);
    expect(fraction(1, 0)).toBe(0);
  });
  it("prints one decimal", () => {
    expect(formatPercent(7)).toBe("7.0%");
  });
});
