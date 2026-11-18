import type { SaveState } from "../../shell/ShellContext";

/**
 * Bookkeeping for autosave. `dirty`: edits that no save has taken yet. `inFlight`: saves sent and not answered.
 * `failed`: the last answered save failed and nothing has succeeded since.
 */
export interface SaveTrack { dirty: boolean; inFlight: number; failed: boolean }
export type SaveEvent = "edit" | "clean" | "start" | "ok" | "fail";

export const IDLE_TRACK: SaveTrack = { dirty: false, inFlight: 0, failed: false };

export function track(s: SaveTrack, e: SaveEvent): SaveTrack {
  switch (e) {
    case "edit": return { ...s, dirty: true, failed: false };
    case "clean": return { ...s, dirty: false };                                   // the draft matches the note again
    case "start": return { ...s, dirty: false, inFlight: s.inFlight + 1, failed: false };
    case "ok": return { ...s, inFlight: Math.max(0, s.inFlight - 1), failed: false };
    case "fail": return { ...s, inFlight: Math.max(0, s.inFlight - 1), failed: true };
  }
}

/** What the title block says: "saved" only when nothing newer is waiting or in flight. */
export function trackState(s: SaveTrack): SaveState {
  if (s.dirty) return "unsaved";
  if (s.inFlight > 0) return "saving";
  return s.failed ? "error" : "saved";
}
