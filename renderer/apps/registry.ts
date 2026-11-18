import type { AppDefinition } from "./types";
import { notes } from "./notes";
import { tasks } from "./tasks";
import { editor } from "./editor";
import { clipboard } from "./clipboard";
import { timer } from "./timer";
import { system } from "./system";
import { news } from "./news";
import { player } from "./player";

/** Sheet number = index + 1. */
export const APPS: readonly AppDefinition[] = [notes, tasks, editor, clipboard, timer, system, news, player];
