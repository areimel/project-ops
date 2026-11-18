import { event, invoke } from "./define";

export interface TimerState { status: "idle" | "running" | "paused" | "done"; label: string;
  durationMs: number; remainingMs: number; endsAt: number | null }   // remaining = endsAt - now while running

export const timerIpc = {
  "timer:get": invoke<[], TimerState>(),
  "timer:start": invoke<[{ minutes: number; label: string }], TimerState>(),
  "timer:pause": invoke<[], TimerState>(),
  "timer:resume": invoke<[], TimerState>(),
  "timer:reset": invoke<[], TimerState>(),
  "timer:changed": event<TimerState>(),
} as const;

export const MIN_MINUTES = 1;
export const MAX_MINUTES = 180;
export const MAX_LABEL = 80;

/** Time left at `now`. Main and renderer both use it: while running it is derived from `endsAt`, never counted down. */
export function remainingMs(s: TimerState, now: number): number {
  return s.status === "running" && s.endsAt !== null ? Math.max(0, s.endsAt - now) : s.remainingMs;
}

/** "12:04", or "1:05:00" from an hour up. Rounds up, so the display reads 00:00 only when time is really up. */
export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const two = (n: number): string => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}
