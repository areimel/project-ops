import { appIpc } from "./app"; import { dataIpc } from "./data"; import { settingsIpc } from "./settings";
import { projectsIpc } from "./projects";
import type { InvokeSpec, DropSpec, EventSpec } from "./define";

export const IPC_PARTS = { app: appIpc, data: dataIpc, settings: settingsIpc, projects: projectsIpc } as const;
export const IPC = { ...appIpc, ...dataIpc, ...settingsIpc, ...projectsIpc } as const;
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
