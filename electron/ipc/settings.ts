import { getSettings, onSettingsChanged, updateSettings } from "../store/settings";
import { emit, handle } from "./handle";
import { v } from "./validate";

export function register(): void {
  onSettingsChanged((s) => emit("settings:changed", s));
  handle("settings:get", v.none, () => getSettings());
  // The patch is healed in main (unknown and invalid keys dropped), never trusted as sent.
  handle("settings:set", v.args(v.raw), (patch) => updateSettings(patch));
}
