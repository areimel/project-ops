import { describe, expect, it } from "vitest";
import { clampMinutes, initialTimer, timerReducer } from "../../electron/features/timerModel";
import { formatClock, remainingMs } from "../../shared/ipc/timer";

const T0 = 1_000_000;
const started = () => timerReducer(initialTimer(), { type: "start", minutes: 25, label: " Write " }, T0);

describe("timerReducer", () => {
  it("start sets endsAt from now and trims the label", () => {
    const s = started();
    expect(s).toMatchObject({ status: "running", label: "Write", durationMs: 1_500_000, endsAt: T0 + 1_500_000 });
  });

  it("clamps minutes to 1..180 and survives junk", () => {
    expect(clampMinutes(0)).toBe(1);
    expect(clampMinutes(500)).toBe(180);
    expect(clampMinutes(2.6)).toBe(3);
    expect(clampMinutes(NaN)).toBe(1);
  });

  it("pause freezes the remaining time and resume continues from it", () => {
    const paused = timerReducer(started(), { type: "pause" }, T0 + 600_000);
    expect(paused).toMatchObject({ status: "paused", endsAt: null, remainingMs: 900_000 });
    expect(remainingMs(paused, T0 + 9_999_999)).toBe(900_000);
    const resumed = timerReducer(paused, { type: "resume" }, T0 + 700_000);
    expect(resumed.endsAt).toBe(T0 + 700_000 + 900_000);
  });

  it("tick finishes only when the time has come", () => {
    const s = started();
    expect(timerReducer(s, { type: "tick" }, T0 + 1_499_999)).toBe(s);
    expect(timerReducer(s, { type: "tick" }, T0 + 1_500_000)).toMatchObject({ status: "done", remainingMs: 0, endsAt: null });
  });

  it("reset returns to idle at the chosen duration and keeps the label", () => {
    const s = timerReducer(started(), { type: "reset" }, T0 + 5);
    expect(s).toMatchObject({ status: "idle", remainingMs: 1_500_000, endsAt: null, label: "Write" });
  });

  it("actions that do not apply return the same object", () => {
    const idle = initialTimer();
    expect(timerReducer(idle, { type: "pause" }, T0)).toBe(idle);
    expect(timerReducer(idle, { type: "resume" }, T0)).toBe(idle);
    expect(timerReducer(idle, { type: "tick" }, T0)).toBe(idle);
    expect(timerReducer(idle, { type: "reset" }, T0)).toBe(idle);
    const running = started();
    expect(timerReducer(running, { type: "resume" }, T0)).toBe(running);
  });
});

describe("remainingMs and formatClock", () => {
  it("derives the time left from endsAt while running, never below zero", () => {
    const s = started();
    expect(remainingMs(s, T0 + 1000)).toBe(1_499_000);
    expect(remainingMs(s, T0 + 99_000_000)).toBe(0);
  });

  it("formats mm:ss and rounds up so 00:00 means done", () => {
    expect(formatClock(1_500_000)).toBe("25:00");
    expect(formatClock(1)).toBe("00:01");
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(3_900_000)).toBe("1:05:00");
  });
});
