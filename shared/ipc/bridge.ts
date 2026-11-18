import type { ThemeId } from "../theme";
import type { ArgsOf, DropChannel, EventChannel, InvokeChannel, PayloadOf, ResultOf } from "./index";

/** `window.app`. Declared in renderer/global.d.ts, implemented by electron/preload.ts. */
export interface AppBridge {
  invoke<C extends InvokeChannel>(channel: C, ...args: ArgsOf<C>): Promise<ResultOf<C>>;
  drop<C extends DropChannel>(channel: C, files: File[]): Promise<ResultOf<C>>;
  on<E extends EventChannel>(event: E, cb: (payload: PayloadOf<E>) => void): () => void;
  platform: "linux" | "darwin" | "win32";
  /** Resolved at window creation (from argv `--app-theme=<theme>:<light|dark>`), so the first paint is right. */
  initialTheme: { theme: ThemeId; mode: "light" | "dark" };
}
