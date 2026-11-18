import type { CommandSpec } from "../../../shared/commands";

// Pure helpers. The file-type helpers (extension list, MIME map) are in shared/mediaTypes.ts, which the
// main process imports too.

/** Seek step for the arrow keys and the back and forward buttons. */
export const SEEK_STEP_SEC = 5;

export const PLAYER_COMMANDS: readonly CommandSpec[] = [
  { id: "player.open", label: "Open a file", group: "Player", accelerator: "CmdOrCtrl+O" },
  { id: "player.togglePlay", label: "Play or pause", group: "Player", keys: [" "] },
  { id: "player.back", label: "Back 5 seconds", group: "Player", keys: ["ArrowLeft"] },
  { id: "player.forward", label: "Forward 5 seconds", group: "Player", keys: ["ArrowRight"] },
  { id: "player.fullscreen", label: "Fullscreen video", group: "Player", keys: ["f"] },
  { id: "player.mute", label: "Mute or unmute", group: "Player", keys: ["m"] },
];
