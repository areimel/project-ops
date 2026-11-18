import { useCallback, useEffect, useState } from "react";
import { MAX_LABEL, MAX_MINUTES, MIN_MINUTES, formatClock, remainingMs, type TimerState } from "../../../shared/ipc/timer";
import { Button } from "../../components/common/Button";
import { Segmented } from "../../components/common/Segmented";
import { TextField } from "../../components/common/TextField";
import { useAppEvent } from "../../hooks/useAppEvent";
import { useCommandHandlers, useHint, useShell } from "../../shell/ShellContext";
import "./timer.css";

const PRESETS = [25, 5, 15].map((m) => ({ value: m, label: `${m} min` }));
const STATUS_TEXT = { idle: "Ready", running: "Running", paused: "Paused", done: "Time's up" } as const;

export default function TimerApp() {
  const { toast } = useShell();
  const hint = useHint();
  // `timer` is main's truth. It is fetched on every mount: leaving the sheet unmounts this
  // component but not the timer, so coming back shows the right time.
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [minutes, setMinutes] = useState("25");
  const [label, setLabel] = useState("");

  useEffect(() => {
    let live = true;
    window.app.invoke("timer:get").then((s) => {
      if (!live) return;
      setTimerState(s);
      setMinutes(String(Math.round(s.durationMs / 60_000)));
      setLabel(s.label);
    }, () => toast("error", "Could not read the timer."));
    return () => { live = false; };
  }, [toast]);

  useAppEvent("timer:changed", setTimerState);

  // Redraw from `endsAt`; the interval only asks for a repaint, it does not count.
  const running = timerState?.status === "running";
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  const send = useCallback((channel: "timer:pause" | "timer:resume" | "timer:reset") => {
    window.app.invoke(channel).then(setTimerState, () => toast("error", "The timer did not respond."));
  }, [toast]);

  const chosen = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(Number(minutes)) || MIN_MINUTES));
  const start = useCallback(() => {
    setMinutes(String(chosen));
    window.app.invoke("timer:start", { minutes: chosen, label: label.trim() }).then(setTimerState,
      () => toast("error", "The timer did not start."));
  }, [chosen, label, toast]);

  const status = timerState?.status ?? "idle";
  const toggle = useCallback(() => {
    if (status === "running") send("timer:pause");
    else if (status === "paused") send("timer:resume");
    else start();
  }, [status, send, start]);
  const reset = useCallback(() => send("timer:reset"), [send]);
  useCommandHandlers({ "timer.toggle": toggle, "timer.reset": reset });

  if (!timerState) return <div className="app-root timer" />;

  const idle = status === "idle";
  const total = idle ? chosen * 60_000 : timerState.durationMs;
  const left = idle ? total : remainingMs(timerState, now);
  const elapsed = total > 0 ? 1 - left / total : 0;
  const mainLabel = { idle: "Start", running: "Pause", paused: "Resume", done: "Start again" }[status];

  return (
    <div className="app-root timer">
      <div className="timer-body">
        <div className="timer-clock" role="timer" aria-label="Time left">{formatClock(left)}</div>
        <div className="timer-rule" aria-hidden="true"><span style={{ width: `${Math.min(1, Math.max(0, elapsed)) * 100}%` }} /></div>
        <p className="timer-status" aria-live="polite">
          {STATUS_TEXT[status]}{status !== "idle" && status !== "done" && timerState.label ? `: ${timerState.label}` : ""}
        </p>

        <div className="timer-actions">
          <Button onClick={toggle} title={hint("timer.toggle")}>{mainLabel}</Button>
          <Button variant="quiet" onClick={reset} disabled={idle} title={hint("timer.reset")}>Reset</Button>
        </div>

        {(idle || status === "done") && (
          <div className="timer-setup">
            <TextField label="Label" value={label} maxLength={MAX_LABEL} placeholder="What are you working on?"
              onChange={setLabel} onEnter={start} />
            <div className="timer-length">
              <Segmented label="Length" options={PRESETS} value={Number(minutes)}
                onChange={(m) => setMinutes(String(m))} />
              <TextField label="Minutes" type="number" min={MIN_MINUTES} max={MAX_MINUTES} value={minutes}
                onChange={setMinutes} onEnter={start} className="timer-minutes" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
