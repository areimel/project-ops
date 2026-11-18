import { Notification } from "electron";
import { getSettings } from "../store/settings";
import { log } from "./logger";

// Held until closed: a garbage-collected Notification never delivers its click.
const live = new Set<Notification>();

/** No-op when the platform has no notifications or the settings switch is off. */
export function notify(o: { title: string; body: string; onClick?: () => void }): void {
  try {
    if (!Notification.isSupported() || !getSettings().notifications) return;
    const n = new Notification({ title: o.title, body: o.body });
    live.add(n);
    const done = (): void => { live.delete(n); };
    n.on("click", () => { done(); o.onClick?.(); });
    n.on("close", done);
    n.on("failed", (_e, error) => { done(); log.warn("notify", "Notification failed", error); });
    n.show();
  } catch (e) {
    log.warn("notify", "Could not show a notification", e);
  }
}
