import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { isAbsolute } from "node:path";
import { stat } from "node:fs/promises";
import { IPC, type ArgsOf, type DropChannel, type EventChannel, type InvokeChannel, type PayloadOf, type ResultOf } from "../../shared/ipc";
import { isSuperseded } from "../../shared/superseded";
import { log } from "../features/logger";
import { getWindow } from "../window";
import { IpcArgError } from "./validate";

export type Check<T> = (x: unknown, at: string) => T;            // throws IpcArgError

const MAX_DROPPED = 32;

function assertKind(channel: string, kind: "invoke" | "drop" | "event"): void {
  const spec = (IPC as Record<string, { kind: string } | undefined>)[channel];
  if (!spec || spec.kind !== kind) throw new Error(`Not a ${kind} channel: ${channel}`);
}

/** Only the main window's top frame may call: a subframe or another webContents is refused. */
function assertSender(e: IpcMainInvokeEvent, channel: string): void {
  const win = getWindow();
  if (!win || e.sender !== win.webContents || e.senderFrame !== win.webContents.mainFrame) {
    throw new Error(`Refused ${channel}: untrusted sender`);
  }
}

/** Errors cross IPC as plain Error(message); a superseded request is expected and not logged. */
function plain(channel: string, e: unknown): Error {
  const message = e instanceof Error ? e.message : String(e);
  if (!isSuperseded(e)) log[e instanceof IpcArgError ? "warn" : "error"]("ipc", `${channel}: ${message}`);
  return new Error(message);
}

/** Checks the channel kind, rejects senders other than the main window's top frame, validates, logs and re-throws as Error(message). */
export function handle<C extends InvokeChannel>(
  channel: C, validate: (args: unknown[]) => ArgsOf<C>,
  fn: (...args: ArgsOf<C>) => ResultOf<C> | Promise<ResultOf<C>>): void {
  assertKind(channel, "invoke");
  ipcMain.handle(channel, async (e, ...args: unknown[]) => {
    try {
      assertSender(e, channel);
      return await fn(...validate(args));
    } catch (err) {
      throw plain(channel, err);
    }
  });
}

/** Paths arrive already resolved by the preload; handleDrop re-checks: string[] <= 32, absolute, existing regular files. */
export function handleDrop<C extends DropChannel>(channel: C, fn: (paths: string[]) => Promise<ResultOf<C>>): void {
  assertKind(channel, "drop");
  ipcMain.handle(channel, async (e, paths: unknown) => {
    try {
      assertSender(e, channel);
      if (!Array.isArray(paths) || paths.length > MAX_DROPPED) throw new IpcArgError("#1", `a list of at most ${MAX_DROPPED} paths`);
      const checked: string[] = [];
      for (const p of paths as unknown[]) {
        if (typeof p !== "string" || !isAbsolute(p)) throw new IpcArgError("#1", "absolute path strings");
        if ((await stat(p).catch(() => null))?.isFile()) checked.push(p);   // vanished or not a regular file: skipped
      }
      return await fn(checked);
    } catch (err) {
      throw plain(channel, err);
    }
  });
}

export function emit<E extends EventChannel>(event: E, ...payload: PayloadOf<E> extends void ? [] : [PayloadOf<E>]): void {
  assertKind(event, "event");
  const win = getWindow();
  if (win && !win.webContents.isDestroyed()) win.webContents.send(event, ...payload);
}
