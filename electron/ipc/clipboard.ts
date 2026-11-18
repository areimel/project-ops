import { clipboard } from "electron";
import { MAX_CLIPBOARD_READ, MAX_CLIPBOARD_WRITE } from "../../shared/ipc/clipboard";
import { handle } from "./handle";
import { v } from "./validate";

export function register(): void {
  // Read only when the renderer asks, never on a timer, and only as plain text: images and rich text are not returned.
  handle("clipboard:read", v.none, async () => ({ text: (await clipboard.readText()).slice(0, MAX_CLIPBOARD_READ) }));
  handle("clipboard:write", v.args(v.string({ max: MAX_CLIPBOARD_WRITE })), async (text) => { await clipboard.writeText(text); });
}
