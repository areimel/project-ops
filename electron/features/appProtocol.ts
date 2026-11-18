import { protocol, session } from "electron";
import { realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { APP_ORIGIN, appScheme, buildCsp } from "../../shared/csp";
import { serveApp } from "./appServe";

export const APP_SCHEME_ENTRY: Electron.CustomScheme = { scheme: appScheme, privileges: { standard: true, secure: true } };

export const appUrl = (path = "index.html"): string => `${APP_ORIGIN}/${path}`;

/** After app ready: answers app-template-app://renderer/... from dist-renderer, confined to that folder. */
export function registerAppProtocol(): void {
  const dir = join(__dirname, "../dist-renderer");
  let root: string;
  try { root = realpathSync(dir); } catch { root = resolve(dir); }
  const csp = buildCsp();
  protocol.handle(appScheme, (req) => serveApp(root, req.url, req.method, csp));
}

/** Dev only: the Vite dev server sends no CSP, so main adds the dev policy to its documents. */
export function applyDevCsp(devUrl: string): void {
  const origin = new URL(devUrl).origin;
  const csp = buildCsp(origin);
  session.defaultSession.webRequest.onHeadersReceived({ urls: [`${origin}/*`] }, (details, cb) => {
    if (details.resourceType !== "mainFrame") { cb({}); return; }
    cb({ responseHeaders: { ...details.responseHeaders, "Content-Security-Policy": [csp] } });
  });
}
