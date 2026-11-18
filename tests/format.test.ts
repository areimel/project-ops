import { describe, expect, it } from "vitest";
import { clamp, formatBytes, formatTime } from "../renderer/utils/format";
import { snapToStep, stepDecimals } from "../renderer/utils/step";

describe("formatTime", () => {
  it("formats minutes and hours", () => {
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(3725)).toBe("1:02:05");
  });
  it("treats invalid input as zero", () => {
    expect(formatTime(NaN)).toBe("0:00");
    expect(formatTime(-5)).toBe("0:00");
  });
});

describe("formatBytes", () => {
  it("scales units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});

describe("clamp", () => {
  it("limits to the range", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });
});

describe("formatTime edges", () => {
  it("rounds down and pads", () => {
    expect(formatTime(59.9)).toBe("0:59");
    expect(formatTime(3600)).toBe("1:00:00");
    expect(formatTime(Infinity)).toBe("0:00");
  });
});

describe("formatBytes edges", () => {
  it("steps up through the units and drops decimals from 100", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(150 * 1024 * 1024)).toBe("150 MB");
    expect(formatBytes(5 * 1024 ** 4)).toBe("5.0 TB");
  });
});

describe("snapToStep", () => {
  it("snaps to the grid without float noise and clamps", () => {
    expect(snapToStep(0.34, 0, 1, 0.1)).toBe(0.3);
    expect(snapToStep(7, 0, 5, 1)).toBe(5);
    expect(snapToStep(0.26, 0.1, 1, 0.05)).toBe(0.25);
  });
  it("counts decimals of a step", () => {
    expect(stepDecimals(1)).toBe(0);
    expect(stepDecimals(0.005)).toBe(3);
  });
});
