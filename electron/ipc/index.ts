import { register as app } from "./app";
import { register as data } from "./data";
import { register as settings } from "./settings";
import { register as editor } from "./editor";
import { register as clipboard } from "./clipboard";
import { register as timer } from "./timer";
import { register as system } from "./system";
import { register as news } from "./news";
import { register as player } from "./player";

export function registerIpc(): void {
  for (const register of [app, data, settings, editor, clipboard, timer, system, news, player]) register();
}
