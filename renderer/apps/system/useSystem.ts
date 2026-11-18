import { useCallback, useEffect, useState } from "react";
import type { SystemInfo, SystemSample } from "../../../shared/ipc/system";
import { useAppEvent } from "../../hooks/useAppEvent";
import { errorMessage } from "../../utils/errorMessage";

export interface SystemState { info: SystemInfo | null; sample: SystemSample | null; error: string | null; retry(): void }

/**
 * Live data is only pushed while someone is watching: subscribe when the sheet mounts, unsubscribe when it
 * unmounts. Main also pauses by itself while the window is hidden or minimised.
 */
export function useSystem(): SystemState {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [sample, setSample] = useState<SystemSample | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useAppEvent("system:sample", setSample);

  useEffect(() => {
    let current = true;                                   // ignore answers that arrive after unmount
    setError(null);
    Promise.all([window.app.invoke("system:info"), window.app.invoke("system:subscribe")])
      .then(([i, first]) => { if (current) { setInfo(i); setSample((s) => s ?? first); } })
      .catch((e: unknown) => { if (current) setError(errorMessage(e)); });
    return () => {
      current = false;
      void window.app.invoke("system:unsubscribe").catch(() => undefined);
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { info, sample, error, retry };
}
