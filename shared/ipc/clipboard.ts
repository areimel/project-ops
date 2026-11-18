import { invoke } from "./define";

/** The longest text main returns from the clipboard. Equal to a snippet's text limit, so what you read can be saved. */
export const MAX_CLIPBOARD_READ = 20_000;
export const MAX_CLIPBOARD_WRITE = 1_000_000;

export const clipboardIpc = {
  "clipboard:read": invoke<[], { text: string }>(),      // plain text, cut to MAX_CLIPBOARD_READ
  "clipboard:write": invoke<[text: string], void>(),     // max 1 MB
} as const;
