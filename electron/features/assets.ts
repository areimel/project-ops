import { app } from "electron";
import { join } from "node:path";

/** build/<name> in dev, process.resourcesPath/<name> packaged (electron-builder extraResources). */
export function assetPath(name: string): string {
  return app.isPackaged ? join(process.resourcesPath, name) : join(app.getAppPath(), "build", name);
}
