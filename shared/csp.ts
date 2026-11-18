import { brand } from "./brand";

/** The scheme the built renderer is served from. Derived from the deep-link scheme until brand.ts has its own field. */
export const appScheme = `${brand.scheme}-app`;
export const APP_HOST = "renderer";
export const APP_ORIGIN = `${appScheme}://${APP_HOST}`;

/**
 * The one Content-Security-Policy, set from the main process as a response header (a `<meta>` tag cannot carry
 * frame-ancestors). Packaged: everything from the app's own origin, no network at all (connect-src 'none'),
 * media from the media scheme, fonts from the page itself and never data:.
 * `devOrigin` (the Vite dev server, e.g. http://localhost:5173) is the only difference: its origin is the page's
 * own, HMR needs its WebSocket, and the React refresh preamble is an inline script. Remote images and fetch
 * calls to other hosts still fail in dev, as they do packaged.
 */
export function buildCsp(devOrigin?: string): string {
  const dev = devOrigin ? new URL(devOrigin) : null;
  const ws = dev ? `${dev.protocol === "https:" ? "wss:" : "ws:"}//${dev.host}` : null;
  return [
    "default-src 'self'",
    `script-src 'self'${dev ? " 'unsafe-inline'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `media-src ${brand.mediaScheme}: blob:`,
    `connect-src ${ws ? `'self' ${ws}` : "'none'"}`,
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}
