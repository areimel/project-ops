import { MAX_LABEL, MAX_MINUTES, MIN_MINUTES } from "../../shared/ipc/timer";
import { dispatchTimer, getTimer } from "../features/timer";
import { handle } from "./handle";
import { v } from "./validate";

/** The one object argument: { minutes, label }. */
const startArgs = v.object({ minutes: v.int(MIN_MINUTES, MAX_MINUTES), label: v.string({ max: MAX_LABEL }) });

export function register(): void {
  handle("timer:get", v.none, () => getTimer());
  handle("timer:start", v.args(startArgs), (o) => dispatchTimer({ type: "start", ...o }));
  handle("timer:pause", v.none, () => dispatchTimer({ type: "pause" }));
  handle("timer:resume", v.none, () => dispatchTimer({ type: "resume" }));
  handle("timer:reset", v.none, () => dispatchTimer({ type: "reset" }));
}
