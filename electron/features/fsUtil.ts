// Small file-system checks shared by the projects and launch code.
import { stat } from "node:fs/promises";

/** True when `path` is a folder (symlinks followed); false when it is anything else, missing or unreadable. */
export const isDirectory = (path: string): Promise<boolean> => stat(path).then((s) => s.isDirectory(), () => false);
