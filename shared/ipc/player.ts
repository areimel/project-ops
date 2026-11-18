import { drop, invoke } from "./define";

export interface MediaFile { url: string; name: string; sizeBytes: number }  // url = app-template-media://file/<token>

export const playerIpc = {
  "player:open-dialog": invoke<[], MediaFile | null>(),
  "player:open-dropped": drop<MediaFile | null>(),
  "player:close": invoke<[], void>(),
  "player:set-playing": invoke<[playing: boolean], void>(),   // power save blocker
  /** After a playback error: tells "the file is gone" from "the format is not supported". */
  "player:is-open-file-present": invoke<[], boolean>(),
} as const;
