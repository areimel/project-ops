import type { AppBridge } from "../shared/ipc/bridge";

declare global {
  interface Window {
    app: AppBridge;
  }
}

export {};
