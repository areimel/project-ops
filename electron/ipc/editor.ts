import { basename } from "node:path";
import type { FileFilter } from "electron";
import type { SavedFile } from "../../shared/ipc/editor";
import { EDITOR_MAX_BYTES, displayFolder, isTextFileName } from "../features/filesCore";
import { confirmReplace, fileHandle, openTextFile, pathOf, pickOpenFile, pickSaveFile, takePendingFile, writeTextFile } from "../features/files";
import { homeDir } from "../features/home";
import { addRecent, listRecents, recentPath } from "../features/recents";
import { getWindow } from "../window";
import { handle, handleDrop } from "./handle";
import { v } from "./validate";

const FILTERS: FileFilter[] = [
  { name: "Text and Markdown", extensions: ["md", "markdown", "txt"] },
  { name: "All files", extensions: ["*"] },
];

/** The renderer sends text, never a path: the file to write is looked up from the id main handed out. */
function write(path: string, text: string): SavedFile {
  if (Buffer.byteLength(text, "utf8") > EDITOR_MAX_BYTES) throw new Error("Too large");
  writeTextFile(path, text);
  return { fileId: fileHandle(path), name: basename(path), folder: displayFolder(path, homeDir()) };
}

export function register(): void {
  handle("editor:open-dialog", v.none, async () => {
    const path = await pickOpenFile({ title: "Open a text file", filters: FILTERS });
    return path ? openTextFile(path) : null;
  });

  handle("editor:open-recent", v.args(v.string({ pattern: /^[0-9a-f]{16}$/ })), (id) => {
    const path = recentPath(id);
    if (!path) throw new Error("That file is no longer there");
    return openTextFile(path);
  });

  // The first dropped file that is text opens; anything else is ignored (the renderer says so when null comes back).
  handleDrop("editor:open-dropped", async (paths) => {
    const path = paths.find((p) => isTextFileName(basename(p)));
    return path ? openTextFile(path) : null;
  });

  handle("editor:take-pending", v.none, () => takePendingFile());

  handle("editor:save", v.args(v.string({ min: 1, max: 64 }), v.string({ max: EDITOR_MAX_BYTES })), (fileId, text) => {
    const path = pathOf(fileId);
    if (!path) throw new Error("That file is no longer open. Use Save as");
    return write(path, text);
  });

  // The first argument (the current file) is part of the contract but unused: the dialog decides where to write.
  handle("editor:save-as",
    v.args(v.nullable(v.string({ min: 1, max: 64 })), v.string({ max: EDITOR_MAX_BYTES }), v.string({ min: 1, max: 255 })),
    async (_fileId, text, suggestedName) => {
      const picked = await pickSaveFile({ title: "Save as", defaultName: suggestedName, filters: FILTERS });
      if (!picked) return null;
      // A name without a text extension could not be opened again, so add one. The dialog only confirmed
      // overwriting `picked`; a different final path that exists needs its own confirmation.
      const path = isTextFileName(basename(picked)) ? picked : `${picked}.md`;
      if (path !== picked && !(await confirmReplace(path))) return null;
      if (!getWindow()) return null;               // the window went away while a dialog was open
      const saved = write(path, text);
      addRecent(path);
      return saved;
    });

  handle("editor:recents", v.none, () => listRecents());
}
