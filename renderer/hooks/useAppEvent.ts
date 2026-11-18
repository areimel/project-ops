import { useEffect } from "react";
import type { EventChannel, PayloadOf } from "../../shared/ipc";
import { useLatest } from "./useLatest";

/** Subscribes to a main -> renderer push for as long as the component is mounted. */
export function useAppEvent<E extends EventChannel>(event: E, cb: (p: PayloadOf<E>) => void): void {
  const ref = useLatest(cb);
  useEffect(() => window.app.on(event, (p) => ref.current(p)), [event, ref]);
}
