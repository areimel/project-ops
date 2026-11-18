import { emit } from "../ipc/handle";
import { formatClock, remainingMs, type TimerState } from "../../shared/ipc/timer";
import { showWindow } from "../window";
import { notify } from "./notifications";
import { setTrayStatus } from "./tray";
import { initialTimer, timerReducer, type TimerAction } from "./timerModel";

// The timer lives here, not in the renderer, so it keeps running while another sheet is open
// (or the window is hidden). The renderer only asks for state and redraws from `endsAt`.
let state: TimerState = initialTimer();
let finishTimeout: NodeJS.Timeout | null = null;
let trayInterval: NodeJS.Timeout | null = null;

export const getTimer = (): TimerState => state;

export function dispatchTimer(action: TimerAction): TimerState {
  const before = state;
  state = timerReducer(state, action, Date.now());
  if (state !== before) {
    sync();
    emit("timer:changed", state);
    if (before.status === "running" && state.status === "done") {
      notify({ title: "Time's up", body: state.label || "Your timer has finished.", onClick: showWindow });
    }
  }
  return state;
}

/** Re-arms the timers to match `state`: one timeout at `endsAt`, and a 1 s tray update while running. */
function sync(): void {
  stopTimerTimers();
  if (state.status !== "running" || state.endsAt === null) { setTrayStatus(null); return; }
  finishTimeout = setTimeout(() => dispatchTimer({ type: "tick" }), Math.max(0, state.endsAt - Date.now()));
  const draw = (): void => setTrayStatus(`${formatClock(remainingMs(state, Date.now()))} left`);
  draw();
  // The interval also catches a timeout that was delayed by the computer sleeping.
  trayInterval = setInterval(() => { draw(); dispatchTimer({ type: "tick" }); }, 1000);
}

function stopTimerTimers(): void {
  if (finishTimeout) clearTimeout(finishTimeout);
  if (trayInterval) clearInterval(trayInterval);
  finishTimeout = trayInterval = null;
}

/** Called from the real shutdown path only (not "before-quit", which an unsaved-changes guard can cancel). */
export function shutdownTimer(): void {
  stopTimerTimers();
  setTrayStatus(null);
}
