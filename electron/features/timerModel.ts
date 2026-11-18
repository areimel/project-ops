import { MAX_LABEL, MAX_MINUTES, MIN_MINUTES, remainingMs, type TimerState } from "../../shared/ipc/timer";

// Pure: no electron, no timers. `now` is an argument so tests can pick the time.
export type TimerAction =
  | { type: "start"; minutes: number; label: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "reset" }
  | { type: "tick" };   // finishes a running timer whose time has come

export const clampMinutes = (m: number): number =>
  Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(Number.isFinite(m) ? m : MIN_MINUTES)));

export function initialTimer(): TimerState {
  return { status: "idle", label: "", durationMs: 25 * 60_000, remainingMs: 25 * 60_000, endsAt: null };
}

/** An action that does not apply in the current status (Pause while idle) returns the same object. */
export function timerReducer(s: TimerState, a: TimerAction, now: number): TimerState {
  switch (a.type) {
    case "start": {
      const durationMs = clampMinutes(a.minutes) * 60_000;
      return { status: "running", label: a.label.trim().slice(0, MAX_LABEL), durationMs, remainingMs: durationMs, endsAt: now + durationMs };
    }
    case "pause":
      return s.status === "running" ? { ...s, status: "paused", remainingMs: remainingMs(s, now), endsAt: null } : s;
    case "resume":
      return s.status === "paused" ? { ...s, status: "running", endsAt: now + s.remainingMs } : s;
    case "reset":
      return s.status === "idle" && s.remainingMs === s.durationMs ? s : { ...s, status: "idle", remainingMs: s.durationMs, endsAt: null };
    case "tick":
      return s.status === "running" && s.endsAt !== null && now >= s.endsAt
        ? { ...s, status: "done", remainingMs: 0, endsAt: null } : s;
  }
}
