import { app } from "electron";

/** The user's home folder, for display-only folder names. One lookup, the one Electron resolves per platform. */
export const homeDir = (): string => app.getPath("home");
