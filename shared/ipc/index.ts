import { appIpc } from "./app"; import { dataIpc } from "./data"; import { settingsIpc } from "./settings";
import { editorIpc } from "./editor"; import { clipboardIpc } from "./clipboard"; import { timerIpc } from "./timer";
import { systemIpc } from "./system"; import { newsIpc } from "./news"; import { playerIpc } from "./player";
import type { InvokeSpec, DropSpec, EventSpec } from "./define";

export const IPC_PARTS = { app: appIpc, data: dataIpc, settings: settingsIpc, editor: editorIpc, clipboard: clipboardIpc,
  timer: timerIpc, system: systemIpc, news: newsIpc, player: playerIpc } as const;
export const IPC = { ...appIpc, ...dataIpc, ...settingsIpc, ...editorIpc, ...clipboardIpc, ...timerIpc,
  ...systemIpc, ...newsIpc, ...playerIpc } as const;
type Ipc = typeof IPC;
type ChannelsOf<K> = { [C in keyof Ipc]: Ipc[C] extends K ? C : never }[keyof Ipc];
export type InvokeChannel = ChannelsOf<InvokeSpec<any, any>>;
export type DropChannel = ChannelsOf<DropSpec<any>>;
export type EventChannel = ChannelsOf<EventSpec<any>>;
export type ArgsOf<C extends InvokeChannel> = Ipc[C] extends InvokeSpec<infer A, any> ? A : never;
export type ResultOf<C extends InvokeChannel | DropChannel> =
  Ipc[C] extends InvokeSpec<any, infer R> ? R : Ipc[C] extends DropSpec<infer R> ? R : never;
export type PayloadOf<E extends EventChannel> = Ipc[E] extends EventSpec<infer P> ? P : never;
export type ChannelKind = Ipc[keyof Ipc]["kind"];
