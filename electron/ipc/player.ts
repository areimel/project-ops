import { app } from "electron";
import { brand } from "../../shared/brand";
import { MEDIA_EXTENSIONS } from "../../shared/mediaTypes";
import { pickOpenFile } from "../features/files";
import { clearServed, serveOnly, servedFileExists } from "../features/media";
import { setPreventSleep } from "../features/powerSave";
import { handle, handleDrop } from "./handle";
import { v } from "./validate";

// Dev only, never in a packaged app: APP_PLAYER_FILE=/path/clip.mp4 stands in for the open dialog, which a
// script cannot drive. It goes through the same serveOnly() check and allowlist as a real choice.
const devFile = (): string | undefined => (app.isPackaged ? undefined : process.env[`${brand.envPrefix}_PLAYER_FILE`]);

export function register(): void {
  handle("player:open-dialog", v.none, async () => {
    const path = devFile() ?? await pickOpenFile({ title: "Open a media file", filters: [{ name: "Media", extensions: MEDIA_EXTENSIONS }] });
    return path ? serveOnly(path) : null;       // null: the person cancelled
  });
  handleDrop("player:open-dropped", async (paths) => (paths[0] ? serveOnly(paths[0]) : null));
  handle("player:close", v.none, () => clearServed());
  handle("player:set-playing", v.args(v.bool), (playing) => setPreventSleep(playing));
  handle("player:is-open-file-present", v.none, () => servedFileExists());
}
