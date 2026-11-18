import { app } from "electron";
import { brand } from "../../shared/brand";
import type { DeepLink } from "../../shared/ipc/app";
import { emit } from "../ipc/handle";
import { getWindow, showWindow } from "../window";
import { argvTargets, parseDeepLink } from "./deepLinkParse";

export { parseDeepLink } from "./deepLinkParse";

// Links that arrive before the renderer called app:ready (cold start) wait here.
const queued: DeepLink[] = [];
let rendererReady = false;

/** Shows the window and routes the link: pushed now when the renderer is ready, queued until app:ready otherwise. */
export function deliverDeepLink(link: DeepLink): void {
  showWindow();
  if (rendererReady && getWindow()) emit("app:deep-link", link);
  else queued.push(link);
}

/** app:ready: the renderer can take pushes; flush what waited. */
export function markRendererReady(): void {
  rendererReady = true;
  for (const link of queued.splice(0)) if (getWindow()) emit("app:deep-link", link);
}

/** The window went away; the next one must say app:ready again. */
export function markRendererGone(): void {
  rendererReady = false;
}

/** Registers the scheme with the OS, handles macOS open-url, and routes a link found in the launch argv. */
export function registerDeepLinks(onLink: (l: DeepLink) => void): void {
  // Registering the dev Electron binary as the system handler would hijack the scheme on a developer machine.
  if (app.isPackaged) app.setAsDefaultProtocolClient(brand.scheme);
  app.on("open-url", (e, url) => {
    e.preventDefault();
    const link = parseDeepLink(url);
    if (link) onLink(link);
  });
  const { link } = argvTargets(process.argv, process.cwd());
  if (link) onLink(link);
}
