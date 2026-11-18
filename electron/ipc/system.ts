import { v } from "./validate";
import { handle } from "./handle";
import { getSystemInfo, subscribe, unsubscribe } from "../features/systemInfo";

export function register(): void {
  handle("system:info", v.none, getSystemInfo);
  handle("system:subscribe", v.none, subscribe);
  handle("system:unsubscribe", v.none, unsubscribe);
}
