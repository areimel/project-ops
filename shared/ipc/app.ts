import type { LinkKey } from "../brand";
import type { MenuContext } from "../commands";
import { event, invoke } from "./define";

export interface AppInfo { version: string; platform: string; electron: string; chrome: string; node: string; isPackaged: boolean }
export interface DeepLink { view: "home" | "settings" | "app"; appId?: string; recordId?: string }
// app-template://home | app-template://settings | app-template://open/<appId>[/<recordId>]
// appId matches ^[a-z][a-z0-9-]{0,31}$, recordId isRecordId; the renderer checks appId against its registry.

export const appIpc = {
  "app:info": invoke<[], AppInfo>(),
  "app:ready": invoke<[], void>(),                       // main then flushes queued app:deep-link
  "app:deep-link": event<DeepLink>(),
  "menu:set-context": invoke<[MenuContext], void>(),
  "menu:command": event<string>(),                       // command id; renderer checks it is active
  "window:set-guard": invoke<[message: string | null], void>(),
  "window:close-requested": event(),
  "window:confirm-close": invoke<[], void>(),
  "window:toggle-fullscreen": invoke<[], void>(),
  "log:write": invoke<[level: "info" | "warn" | "error", message: string], void>(),  // max 2 000 chars, 20/min
  "links:open": invoke<[LinkKey], void>(),
} as const;
