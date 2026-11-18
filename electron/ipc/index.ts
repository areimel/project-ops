import { register as app } from "./app";
import { register as data } from "./data";
import { register as settings } from "./settings";

export function registerIpc(): void {
  for (const register of [app, data, settings]) register();
}
