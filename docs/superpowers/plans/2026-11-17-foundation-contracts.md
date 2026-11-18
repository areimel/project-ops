# Foundation contracts

Date: 2026-11-17. Brief for the Phase 2 foundation builders (A to E) and the Phase 3 demo and settings builders. Read with the spec `docs/superpowers/specs/2026-11-17-app-template-design.md` and the Rules / Security model / Concurrency sections of the root `CLAUDE.md`, which still apply. Original code to restore or trim from: git `f4ff043` (same as `../shader-video-player/`).

The code blocks below are contracts: names, signatures, file paths and CSS class names are fixed. Bodies are the builder's. If a contract is wrong, do not change it silently: put the change in your report so the integrator can apply it everywhere.

## 0. How the build runs

- **Wave 0 (builder A, one commit, first):** paste every contract block in this document marked `seed` into its file, with stub bodies (`throw new Error("todo")`, empty arrays, `null` components). After this commit the whole tree typechecks against the contracts. Every other builder starts from this commit. Seeded files then belong to the owner in section 3.
- **Phase 2:** A, B, C, D, E in parallel, each on its own branch or worktree, touching only its own paths. Merge order: A, B, C, E, D. Each commit passes `pnpm typecheck && pnpm test`.
- **Phase 3:** 8 demo builders + 1 settings builder, in parallel, each only inside its own paths (section 2). No Phase 3 builder edits an index, registry, preload or menu file.
- Testing: vitest runs in node, no DOM. Anything worth testing lives in a module that imports neither `electron` nor React (`*Model.ts`, `*Shape.ts`, `*Core.ts`, or plain `utils/`).

## 1. Contracts

### 1.1 Brand: `shared/brand.ts` (seed, owner A)

```ts
export const brand = {
  name: "App Template",                 // window title, About, tray tooltip, home heading
  tagline: "A starter for desktop apps, one sheet per skill",
  packageName: "electron-app-template", // package.json "name", .deb name, executable
  appId: "com.example.apptemplate",     // electron-builder appId, Windows AppUserModelId
  scheme: "app-template",               // deep links: app-template://open/notes
  mediaScheme: "app-template-media",    // Player's file protocol (privileged scheme)
  storagePrefix: "app-template",        // localStorage keys: `${storagePrefix}.${key}`
  envPrefix: "APP",                     // APP_CAPTURE, APP_LOG_LEVEL, APP_WINDOW_BOUNDS
  author: "Alec Reimel",
  copyright: "Copyright © Alec Reimel. MIT licence.",
  links: {
    website: "https://example.com/",
    issues: "https://github.com/areimel/electron-app-template/issues",
    source: "https://github.com/areimel/electron-app-template",
  },
  defaultTheme: "blueprint",
  defaultMode: "system",
} as const;

export type LinkKey = keyof typeof brand.links;
export const storageKey = (key: string): string => `${brand.storagePrefix}.${key}`;
```

Readers: main (`window.ts` title, `links.ts`, `tray.ts`, `deepLink.ts`, `media.ts`, `devCapture.ts`, `logger.ts`), renderer (home heading, title block, settings About), `vite.config.ts` (CSP `media-src`, `<title>` via `transformIndexHtml`), `shared/superseded.ts` (marker `APP_SUPERSEDED`). **Not** read by `electron-builder.yml` or `package.json`: they keep their own copies of name, productName, appId, executableName and `protocols`. `tests/brand.test.ts` reads both files as text and fails when they drift from `brand`.

### 1.2 IPC: `shared/ipc/` (seed)

Decision: one **generic bridge** (`invoke` / `drop` / `on`) typed by a runtime channel map. The preload never changes when a feature is added, so parallel builders never touch it; argument and result types still flow from the map to both sides.

`shared/ipc/define.ts` (owner B):

```ts
export interface InvokeSpec<A extends unknown[], R> { kind: "invoke"; _t?: (...a: A) => R }
/** Renderer passes File objects; the preload turns them into paths. Never callable through invoke(). */
export interface DropSpec<R> { kind: "drop"; _t?: () => R }
/** Main -> renderer push. */
export interface EventSpec<P> { kind: "event"; _t?: (p: P) => void }
export const invoke = <A extends unknown[], R>(): InvokeSpec<A, R> => ({ kind: "invoke" });
export const drop = <R>(): DropSpec<R> => ({ kind: "drop" });
export const event = <P = void>(): EventSpec<P> => ({ kind: "event" });
```

`shared/ipc/index.ts` (owner B):

```ts
import { appIpc } from "./app"; import { dataIpc } from "./data"; import { settingsIpc } from "./settings";
import { editorIpc } from "./editor"; import { clipboardIpc } from "./clipboard"; import { timerIpc } from "./timer";
import { systemIpc } from "./system"; import { newsIpc } from "./news"; import { playerIpc } from "./player";

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
```

Rules: channel names are `"<part>:<verb-kebab>"` and every key in `shared/ipc/<part>.ts` starts with `<part>:` (the `app` part also holds `menu:`, `window:`, `log:`, `links:`). `tests/ipc.test.ts` checks the prefixes and that `Object.keys(IPC).length` equals the sum of the parts (no key silently overwritten by the spread). A Phase 3 builder adds or changes channels only inside its own part file; the index never changes.

Bridge, exposed as `window.app` (`renderer/global.d.ts` declares it; preload implements it; owner B):

```ts
export interface AppBridge {
  invoke<C extends InvokeChannel>(channel: C, ...args: ArgsOf<C>): Promise<ResultOf<C>>;
  drop<C extends DropChannel>(channel: C, files: File[]): Promise<ResultOf<C>>;
  on<E extends EventChannel>(event: E, cb: (payload: PayloadOf<E>) => void): () => void;
  platform: "linux" | "darwin" | "win32";
  /** Resolved at window creation (from argv `--app-theme=<theme>:<light|dark>`), so the first paint is right. */
  initialTheme: { theme: ThemeId; mode: "light" | "dark" };
}
```

Preload rules: `invoke` refuses names whose `IPC[name].kind !== "invoke"`; `drop` refuses non-drop names and maps `File` objects to paths with `webUtils.getPathForFile` (non-Files skipped, max 32); `on` refuses non-event names and returns the unsubscribe. A rejected invoke is re-thrown as `new Error(message)` with Electron's `Error invoking remote method '…': Error:` prefix stripped.

Main side, `electron/ipc/handle.ts` (owner B):

```ts
export type Check<T> = (x: unknown, at: string) => T;            // throws IpcArgError
export function handle<C extends InvokeChannel>(
  channel: C, validate: (args: unknown[]) => ArgsOf<C>,
  fn: (...args: ArgsOf<C>) => ResultOf<C> | Promise<ResultOf<C>>): void;
/** Paths arrive already resolved by the preload; handleDrop re-checks: string[] <= 32, absolute, existing regular files. */
export function handleDrop<C extends DropChannel>(channel: C, fn: (paths: string[]) => Promise<ResultOf<C>>): void;
export function emit<E extends EventChannel>(event: E, ...payload: PayloadOf<E> extends void ? [] : [PayloadOf<E>]): void;
```

`handle` checks the channel's kind, rejects senders other than the main window's top frame, runs `validate`, logs and re-throws errors as plain `Error(message)`. `electron/ipc/validate.ts` (owner B):

```ts
export const v: {
  none: (a: unknown[]) => [];
  args<T extends unknown[]>(...checks: { [K in keyof T]: Check<T[K]> }): (a: unknown[]) => T;
  string(o?: { min?: number; max?: number; pattern?: RegExp }): Check<string>;  // default max 10_000
  int(min: number, max: number): Check<number>;
  bool: Check<boolean>;
  oneOf<T extends string>(values: readonly T[]): Check<T>;
  nullable<T>(c: Check<T>): Check<T | null>;
  recordId: Check<string>;            // isRecordId
  collection: Check<CollectionName>;  // key of COLLECTIONS
  raw: Check<unknown>;                // only for payloads that go straight into a heal()
};
```

Register files: `electron/ipc/index.ts` (owner B) calls `register()` from each of `electron/ipc/{app,data,settings,editor,clipboard,timer,system,news,player}.ts`. Phase 2 seeds all nine; demo files start as `export function register(): void {}`.

#### Channel list

`shared/ipc/app.ts` (owner E):

| Channel | Kind | Args | Result / payload |
|---|---|---|---|
| `app:info` | invoke | `[]` | `AppInfo {version; platform; electron; chrome; node; isPackaged}` |
| `app:ready` | invoke | `[]` | `void` (main then flushes queued `app:deep-link`) |
| `app:deep-link` | event | | `DeepLink` |
| `menu:set-context` | invoke | `[MenuContext]` | `void` |
| `menu:command` | event | | `string` (command id; renderer checks it is active) |
| `window:set-guard` | invoke | `[message: string \| null]` | `void` |
| `window:close-requested` | event | | `void` |
| `window:confirm-close` | invoke | `[]` | `void` |
| `window:toggle-fullscreen` | invoke | `[]` | `void` |
| `log:write` | invoke | `[level: "info"\|"warn"\|"error", message: string]` | `void` (max 2 000 chars, 20/min) |
| `links:open` | invoke | `[LinkKey]` | `void` |

```ts
export interface DeepLink { view: "home" | "settings" | "app"; appId?: string; recordId?: string }
// app-template://home | app-template://settings | app-template://open/<appId>[/<recordId>]
// appId matches ^[a-z][a-z0-9-]{0,31}$, recordId isRecordId; the renderer checks appId against its registry.
```

`shared/ipc/data.ts` and `shared/ipc/settings.ts` (owner B):

| Channel | Kind | Args | Result / payload |
|---|---|---|---|
| `data:list` | invoke | `[CollectionName]` | `AnyRecord[]` |
| `data:create` | invoke | `[CollectionName, input: unknown]` | `AnyRecord` |
| `data:update` | invoke | `[CollectionName, id, patch: unknown]` | `AnyRecord` |
| `data:remove` | invoke | `[CollectionName, id]` | `Removed<AnyRecord>` |
| `data:restore` | invoke | `[CollectionName, record: unknown, index: number]` | `AnyRecord` |
| `data:reorder` | invoke | `[CollectionName, ids: string[]]` | `void` |
| `data:changed` | event | | `{ name: CollectionName; items: AnyRecord[] }` |
| `data:export` | invoke | `[]` | `{ saved: boolean }` (save dialog in main) |
| `data:import` | invoke | `[]` | `{ imported: boolean; counts: Record<CollectionName, number> }` |
| `data:reset` | invoke | `[]` | `void` (deletes collections and settings; emits changes) |
| `data:show-folder` | invoke | `[]` | `void` (`shell.openPath(userData)`) |
| `settings:get` | invoke | `[]` | `Settings` |
| `settings:set` | invoke | `[patch: unknown]` | `Settings` |
| `settings:changed` | event | | `Settings` |

Demo parts (seeded by B from this table; each then owned by its Phase 3 builder):

| Channel | Kind | Args | Result / payload |
|---|---|---|---|
| `editor:open-dialog` | invoke | `[]` | `OpenedFile \| null` |
| `editor:open-recent` | invoke | `[recentId: string]` | `OpenedFile` |
| `editor:open-dropped` | drop | | `OpenedFile \| null` |
| `editor:take-pending` | invoke | `[]` | `OpenedFile \| null` (file from launch / second instance) |
| `editor:save` | invoke | `[fileId: string, text: string]` | `SavedFile` |
| `editor:save-as` | invoke | `[fileId: string \| null, text: string, suggestedName: string]` | `SavedFile \| null` |
| `editor:recents` | invoke | `[]` | `RecentView[]` |
| `editor:opened` | event | | `OpenedFile` |
| `clipboard:read` | invoke | `[]` | `{ text: string }` |
| `clipboard:write` | invoke | `[text: string]` | `void` (max 1 MB) |
| `timer:get` | invoke | `[]` | `TimerState` |
| `timer:start` | invoke | `[{ minutes: number; label: string }]` | `TimerState` |
| `timer:pause` / `timer:resume` / `timer:reset` | invoke | `[]` | `TimerState` |
| `timer:changed` | event | | `TimerState` |
| `system:info` | invoke | `[]` | `SystemInfo` |
| `system:subscribe` | invoke | `[]` | `SystemSample` (then 1 s `system:sample` pushes) |
| `system:unsubscribe` | invoke | `[]` | `void` |
| `system:sample` | event | | `SystemSample` |
| `news:list` | invoke | `[{ feed: NewsFeed; refresh: boolean }]` | `NewsPage` |
| `news:open` | invoke | `[id: number, target: "article" \| "comments"]` | `void` |
| `player:open-dialog` | invoke | `[]` | `MediaFile \| null` |
| `player:open-dropped` | drop | | `MediaFile \| null` |
| `player:close` | invoke | `[]` | `void` |
| `player:set-playing` | invoke | `[playing: boolean]` | `void` (power save blocker) |

```ts
// shared/ipc/editor.ts
export interface OpenedFile { fileId: string; name: string; folder: string; text: string }
export interface SavedFile { fileId: string; name: string; folder: string }
export interface RecentView { id: string; name: string; folder: string }  // id = 16 hex of sha1(path)
// shared/ipc/timer.ts
export interface TimerState { status: "idle" | "running" | "paused" | "done"; label: string;
  durationMs: number; remainingMs: number; endsAt: number | null }   // remaining = endsAt - now while running
// shared/ipc/system.ts
export interface SystemInfo { os: string; release: string; arch: string; cpuModel: string; cores: number;
  totalMemBytes: number; hostname: string; versions: { app: string; electron: string; chrome: string; node: string } }
export interface SystemSample { at: number; cpuPercent: number; memUsedBytes: number; memTotalBytes: number;
  appMemBytes: number; uptimeSec: number; loadAvg: [number, number, number] }
// shared/ipc/news.ts
export type NewsFeed = "top" | "new" | "best";
export interface NewsItem { id: number; title: string; host: string | null; score: number; by: string;
  comments: number; time: number }
export interface NewsPage { feed: NewsFeed; items: NewsItem[]; fetchedAt: number; source: "network" | "cache";
  offline: boolean }
// shared/ipc/player.ts
export interface MediaFile { url: string; name: string; sizeBytes: number }  // url = app-template-media://file/<token>
```

Paths never reach the renderer as handles: files are `fileId` (random, mapped in main), recents are hashed ids, media is a random token. `folder` is display text only and is never accepted back.

### 1.3 Storage

`shared/collections/base.ts` (seed, owner B):

```ts
export interface RecordBase { id: string; createdAt: number; updatedAt: number }   // ms since epoch
export const RECORD_ID = /^[0-9a-f]{16}$/;                                         // randomBytes(8).toString("hex")
export const isRecordId = (x: unknown): x is string => typeof x === "string" && RECORD_ID.test(x);
export interface CollectionSpec<F> {
  name: string;      // also the file: `${name}.json`, envelope { version, items }
  version: number;
  max: number;       // create beyond it throws "Limit reached: <max> <name>"
  /** Fields only. Fills defaults, trims to limits, drops unknown keys; null = unusable. Used for file reads,
   *  create (heal(input)), update (heal({...current, ...patch})) and restore. */
  heal(raw: unknown): F | null;
}
export type Removed<T> = { record: T; index: number };
```

`shared/collections/{notes,tasks,snippets}.ts` (seed, owner B; Phase 3 owner may add fields):

```ts
export interface NoteFields { title: string; body: string; pinned: boolean }          // title <= 200, body <= 100_000
export type Note = RecordBase & NoteFields;
export const notes: CollectionSpec<NoteFields>;                                       // version 1, max 1000
export interface TaskFields { title: string; done: boolean; due: string | null }      // title <= 500, due YYYY-MM-DD
export type Task = RecordBase & TaskFields;                                           // order = array order
export const tasks: CollectionSpec<TaskFields>;                                       // version 1, max 2000
export interface SnippetFields { label: string; text: string }                        // label <= 100, text <= 20_000
export type Snippet = RecordBase & SnippetFields;
export const snippets: CollectionSpec<SnippetFields>;                                 // version 1, max 200
```

`shared/collections/index.ts` is the allowlist (owner B):

```ts
export const COLLECTIONS = { notes, tasks, snippets } as const;
export type CollectionName = keyof typeof COLLECTIONS;
export type FieldsOf<N extends CollectionName> = (typeof COLLECTIONS)[N] extends CollectionSpec<infer F> ? F : never;
export type RecordOf<N extends CollectionName> = RecordBase & FieldsOf<N>;
export type AnyRecord = RecordOf<CollectionName>;
```

Main, `electron/store/collectionCore.ts` (pure, tested) + `electron/store/collection.ts` (IO, events), owner B:

```ts
export interface Collection<F> {
  list(): (RecordBase & F)[];
  get(id: string): (RecordBase & F) | undefined;
  create(input: unknown): RecordBase & F;
  update(id: string, patch: unknown): RecordBase & F;           // throws "Not found" for an unknown id
  remove(id: string): Removed<RecordBase & F>;
  restore(record: unknown, index: number): RecordBase & F;      // keeps id if valid and unused, else new id
  reorder(ids: string[]): void;                                 // must be a permutation of current ids
  replaceAll(items: unknown): void;                             // import; heals every item
  clear(): void;                                                // reset; deletes the file
  onChange(cb: (items: (RecordBase & F)[]) => void): () => void;
}
export function createCollection<F>(spec: CollectionSpec<F>): Collection<F>;
export function collection<N extends CollectionName>(name: N): Collection<FieldsOf<N>>; // lazily created, one per name
```

Reads go through `readJson` (kept, moved to `electron/store/jsonStore.ts`), held in memory, written through `writeJson` on every change. `electron/ipc/data.ts` emits `data:changed` from `onChange`.

Renderer, `renderer/hooks/useCollection.ts` (owner B; the one cast from `AnyRecord` lives here):

```ts
export function useCollection<N extends CollectionName>(name: N): {
  items: RecordOf<N>[]; status: "loading" | "ready" | "error"; error: string | null;
  create(input: Partial<FieldsOf<N>>): Promise<RecordOf<N>>;
  update(id: string, patch: Partial<FieldsOf<N>>): Promise<RecordOf<N>>;
  remove(id: string): Promise<Removed<RecordOf<N>>>;
  restore(removed: Removed<RecordOf<N>>): Promise<void>;
  reorder(ids: string[]): Promise<void>;
};
```

Mutations await the invoke; `items` updates only from `data:changed` (one source of truth, no optimistic state).

Settings, `shared/settings.ts` (seed, owner B):

```ts
export type ModeSetting = "system" | "light" | "dark";
export interface Settings {
  theme: ThemeId;            // from shared/theme.ts
  mode: ModeSetting;
  accent: string | null;     // ^#[0-9a-f]{6}$ override of --accent, null = theme accent
  closeToTray: boolean;      // default false
  notifications: boolean;    // default true
}
export const SETTINGS_VERSION = 1;               // file settings.json = { version, values }
export function defaultSettings(): Settings;     // theme/mode from brand
export function healSettings(raw: unknown): Settings;
export function healSettingsPatch(raw: unknown): Partial<Settings>;  // drops unknown and invalid keys
```

Main `electron/store/settings.ts`: `getSettings(): Settings; updateSettings(patch: unknown): Settings; onSettingsChanged(cb): () => void`. On change main sets `nativeTheme.themeSource = mode` (so menus, dialogs and `prefers-color-scheme` follow) and the window's `backgroundColor`.

Renderer `renderer/hooks/useSettings.ts` (owner B), a module store over `useSyncExternalStore`, defaults until `settings:get` resolves:

```ts
export function useSettings(): [Settings, (patch: Partial<Settings>) => Promise<void>];
export function useSetting<K extends keyof Settings>(key: K): [Settings[K], (value: Settings[K]) => void];
export function useAppEvent<E extends EventChannel>(event: E, cb: (p: PayloadOf<E>) => void): void; // in hooks/useAppEvent.ts
```

Window state, `electron/store/windowState.ts` + pure `windowStateShape.ts` (owner B):

```ts
export interface WindowState { bounds: { x: number; y: number; width: number; height: number } | null; maximized: boolean }
export function healWindowState(raw: unknown): WindowState;
/** Keeps the window on a visible work area; drops x/y when off every display; min 720x480. */
export function fitToDisplays(s: WindowState, workAreas: Rect[]): WindowState;
export function loadWindowState(): WindowState;            // window-state.json
export function trackWindowState(win: BrowserWindow): void; // saves on resize/move (500 ms debounce) and close
```

Export bundle, `electron/store/bundle.ts` (pure) + `electron/store/dataTransfer.ts`: `{ format: brand.packageName, version: 1, exportedAt, settings, collections: { notes: [], tasks: [], snippets: [] } }`; `healBundle(raw): Bundle | null`; unknown collections ignored.

Stored files: `settings.json`, `window-state.json`, `recents.json`, `notes.json`, `tasks.json`, `snippets.json`, `news-cache.json`, and `logs/main.log` (logger, not jsonStore).

### 1.4 Commands: `shared/commands.ts` (seed, owner D)

Keeps `parseKey`, `formatKey`, `toAccelerator`. Groups become plain strings with an order; each app contributes commands through its `AppDefinition`, so no two builders edit this file.

```ts
export interface CommandSpec {
  id: string;                 // "shell.palette" | "go.notes" | "<appId>.<name>", e.g. "notes.new"
  label: string;              // sentence case: "New note"
  group: string;              // heading in menu, palette and help: "View", "Notes"
  keys?: readonly string[];   // renderer-handled plain keys: "n", "Shift+E", "?", "Delete", " "
  accelerator?: string;       // menu-handled: "CmdOrCtrl+K"; the menu sends menu:command
  menu?: boolean;             // in the native menu (default true)
  palette?: boolean;          // in the command palette (default true)
}
export const COMMAND_ID = /^[a-z][a-z0-9-]*\.[a-zA-Z0-9-]+$/;
export const SHELL_GROUPS = ["File", "View", "Go", "Help"] as const;
export const SHELL_COMMANDS: readonly CommandSpec[] = [
  { id: "shell.settings", label: "Open settings", group: "File", accelerator: "CmdOrCtrl+," },
  { id: "shell.palette", label: "Command palette", group: "View", accelerator: "CmdOrCtrl+K" },
  { id: "shell.cycleMode", label: "Switch light or dark mode", group: "View", accelerator: "CmdOrCtrl+Shift+L" },
  { id: "shell.fullscreen", label: "Fullscreen", group: "View", accelerator: "F11" },
  { id: "shell.home", label: "Go to home", group: "Go", accelerator: "CmdOrCtrl+Shift+H" },
  { id: "shell.shortcuts", label: "Keyboard shortcuts", group: "Help", keys: ["?"] },
];
/** "go.<id>" commands, CmdOrCtrl+1..9 by registry order. Used by the renderer and by main's Go menu. */
export function goCommands(apps: readonly { id: string; name: string }[]): CommandSpec[];
export function hint(c: CommandSpec, mac: boolean): string;   // "New note (N)"
export function keysOf(c: CommandSpec): string[];
export interface MenuContext {
  apps: { id: string; name: string }[];                         // registry order, <= 20
  app: { name: string; commands: CommandSpec[] } | null;        // active app, <= 30 commands
}
```

Consumers:
- **Renderer** `renderer/shell/commandTable.ts` (pure): `activeCommands(app: AppDefinition | null, apps): CommandSpec[]` = shell + go + active app. Feeds `useShortcuts`, the palette and `ShortcutHelp`.
- `renderer/hooks/useShortcuts.ts` (renamed from `usePlayerShortcuts`): `useShortcuts(commands: readonly CommandSpec[], handlers: Record<string, () => void>, enabled: boolean)`. Handles `keys` only (same input/control guards as today). `commandForKey(commands, e)` exported for tests.
- **Main** `menu.ts`: static File / Edit (`role: editMenu`) / View / Go / Window / Help from `SHELL_COMMANDS` and `goCommands(context.apps)`, plus one menu named after the active app from `context.app`. The renderer sends `menu:set-context` on start and on each route change; main validates (ids match `COMMAND_ID`, labels <= 60, accelerators match `/^((CmdOrCtrl|Ctrl|Alt|Shift)\+){0,3}([A-Z0-9,./]|F\d{1,2})$/`) and rebuilds. Items with `keys` show `toAccelerator(keys[0])` with `registerAccelerator: false`. macOS gets `role: appMenu` first. Dev builds add reload and devtools to View.
- Handlers: the shell registers shell and go handlers; an app registers its own with `useCommandHandlers` (1.5). A command without a live handler is hidden from the palette and is a no-op.

### 1.5 Renderer shell

`renderer/apps/types.ts` (seed, owner D):

```ts
export interface AppDefinition {
  id: string;                     // ^[a-z][a-z0-9-]{0,31}$, also the CSS prefix and command prefix
  name: string;                   // "Notes"
  icon: IconName;
  summary: string;                // sheet index line: what it demonstrates
  component: LazyExoticComponent<ComponentType>;   // lazy(() => import("./NotesApp"))
  commands?: readonly CommandSpec[];               // static; ids start with `${id}.`
}
```

`renderer/apps/registry.ts` (owner D): `export const APPS: readonly AppDefinition[] = [notes, tasks, editor, clipboard, timer, system, news, player];` imported from each `apps/<id>/index.ts`. Sheet number = index + 1. `tests/registry.test.ts` checks ids, command prefixes and uniqueness.

Router, `renderer/shell/router.ts` (pure, tested):

```ts
export type Route = { view: "home" } | { view: "settings" } | { view: "app"; appId: string; recordId: string | null };
export type RouterAction = { type: "home" } | { type: "settings" } | { type: "open"; appId: string; recordId?: string }
  | { type: "deep-link"; link: DeepLink };
export function routerReducer(route: Route, action: RouterAction, appIds: readonly string[]): Route; // unknown app -> home
```

Navigation is guarded: `navigate()` in the shell asks `confirm()` when a guard is set. The router itself stays pure.

Shell context, `renderer/shell/ShellContext.tsx`. A context, not props, because nested components several levels down (rows, toolbars) need toasts and confirm.

```ts
export type SaveState = "saved" | "saving" | "unsaved" | "error";
export interface TitleInfo { count?: string; saveState?: SaveState }      // count: "12 notes"
export interface ConfirmOptions { title: string; body?: string; confirmLabel: string; cancelLabel?: string; danger?: boolean }
export interface ShellApi {
  route: Route;
  sheet: { index: number; total: number } | null;     // null on home and settings
  navigate(action: RouterAction): void;
  toast(kind: ToastKind, message: string, action?: ToastAction): void;
  confirm(o: ConfirmOptions): Promise<boolean>;
}
export function useShell(): ShellApi;
export function useTitleInfo(info: TitleInfo): void;                 // set while mounted, cleared on unmount
export function useCommandHandlers(handlers: Record<string, () => void>): void;
export function useNavigationGuard(message: string | null): void;    // also sets window:set-guard
```

`renderer/shell/ErrorBoundary.tsx`: `<ErrorBoundary resetKey={appId} onError={(e) => log:write}>`; fallback is an `EmptyState` "This sheet stopped working" with "Try again" and "Go to home". Each app renders as `<ErrorBoundary><Suspense fallback={<Spinner label={`Loading ${name}`} />}><Component /></Suspense></ErrorBoundary>`. The app's CSS is imported by its component module, so it loads with the lazy chunk.

Window close guard: main intercepts `close` when a guard is set, emits `window:close-requested`; the shell confirms and calls `window:confirm-close`. With `closeToTray` on, close hides the window and the guard is not asked.

### 1.6 Theme

Files (owner C): `renderer/theme/tokens.css` (non-colour tokens and derived colours), `renderer/theme/themes/{blueprint,graphite,kraft}.css` (base colours only), `renderer/theme/index.css` (imports), `renderer/theme/color.ts` (pure: `contrastRatio(a, b)`, `inkFor(hex): string`), `renderer/theme/useTheme.ts`, `shared/theme.ts`.

```ts
// shared/theme.ts
export const THEMES = [
  { id: "blueprint", name: "Blueprint" }, { id: "graphite", name: "Graphite" }, { id: "kraft", name: "Kraft" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
/** --bg per theme and mode, for BrowserWindow backgroundColor. tests/theme.test.ts checks it against the CSS. */
export const WINDOW_BG: Record<ThemeId, { light: string; dark: string }>;
export const isThemeId = (x: unknown): x is ThemeId => THEMES.some((t) => t.id === x);
```

Mechanism: `<html data-theme="blueprint" data-mode="dark">`. Each theme file declares `:root[data-theme="<id>"][data-mode="light"] { … }` and the dark twin. `useTheme()` (called once in the shell) sets both attributes from settings; `mode: "system"` resolves with `matchMedia("(prefers-color-scheme: dark)")`, which follows `nativeTheme` and updates live. A set accent writes `--accent` and `--accent-ink` (from `inkFor`) as inline style on `<html>`; null removes them. Before React mounts, `renderer/main.tsx` applies `window.app.initialTheme`. Main creates the window with `show: false`, `backgroundColor: WINDOW_BG[theme][resolvedMode]`, passes `--app-theme=<theme>:<mode>` in `webPreferences.additionalArguments`, and shows on `ready-to-show`.

Base colour tokens (every theme file defines all 11 for both modes): `--bg --surface --surface-raised --text --text-muted --line --accent --accent-ink --danger --danger-ink --success`.

Derived (in `tokens.css`, on `:root`, so they follow theme and accent):

```css
--hover: color-mix(in srgb, var(--text) 7%, transparent);
--selected: color-mix(in srgb, var(--accent) 16%, transparent);
--scrim: color-mix(in srgb, var(--bg) 72%, transparent);
--grid: color-mix(in srgb, var(--line) 40%, transparent);   /* home drafting grid only */
--control-border: var(--text-muted);                        /* inputs, switches: 3:1 non-text contrast */
--focus: var(--accent);
```

Non-colour tokens:

```css
--font-text: "Barlow", system-ui, sans-serif;  --font-display: "Barlow Condensed", "Barlow", sans-serif;
--font-mono: ui-monospace, "DejaVu Sans Mono", monospace;   /* Editor text area only */
--fs-xs: 12px; --fs-sm: 13px; --fs-md: 14px; --fs-lg: 16px; --fs-xl: 20px; --fs-2xl: 26px; --fs-3xl: 34px;
--fw-regular: 400; --fw-medium: 500; --fw-bold: 600; --lh-tight: 1.2; --lh-body: 1.5;
--sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --sp-6: 32px; --sp-7: 48px;
--r: 2px; --r-pill: 999px;  --line-w: 1px;  --focus-w: 2px; --focus-offset: 2px;
--z-base: 0; --z-chrome: 10; --z-popover: 20; --z-dialog: 30; --z-toast: 40;
--dur-fast: 120ms; --dur: 180ms; --ease: cubic-bezier(.2, .7, .2, 1);
--titlebar-h: 40px; --rail-w: 56px; --footer-h: 48px; --content-max: 960px;
```

Focus: `:focus-visible { outline: var(--focus-w) solid var(--focus); outline-offset: var(--focus-offset); }`. Reduced motion zeroes transitions and animations (kept from today). Fonts: `@fontsource/barlow` 400/500/600 and `@fontsource/barlow-condensed` 500/600, imported in `renderer/main.tsx`; `assetsInlineLimit` rule kept.

Values (Blueprint text pairs are from the spec; the rest derived; ratios checked on `--surface`):

| Token | Blueprint L | Blueprint D | Graphite L | Graphite D | Kraft L | Kraft D |
|---|---|---|---|---|---|---|
| `--bg` | `#EEF2F6` | `#0F2A52` | `#F1F2F4` | `#23272C` | `#EFE6D6` | `#2B2219` |
| `--surface` | `#FBFCFE` | `#163868` | `#FCFCFD` | `#2C3137` | `#FAF5EC` | `#362B20` |
| `--surface-raised` | `#FFFFFF` | `#1D4478` | `#FFFFFF` | `#353B42` | `#FFFDF8` | `#413428` |
| `--text` | `#14315C` | `#E6EEFA` | `#1E2329` | `#E8EAED` | `#3A2A1A` | `#F2E8D9` |
| `--text-muted` | `#5E7391` | `#A9BEDD` | `#5C6570` | `#A3ABB5` | `#6E5A44` | `#C9B79F` |
| `--line` | `#9DB4D3` | `#4F76AE` | `#B9C0C8` | `#555E69` | `#C8B497` | `#6B5841` |
| `--accent` | `#D1345B` | `#FFD166` | `#2558C9` | `#7AA7FF` | `#B5481F` | `#F0A35E` |
| `--accent-ink` | `#FFFFFF` | `#0F2A52` | `#FFFFFF` | `#10161F` | `#FFFFFF` | `#2B2219` |
| `--danger` | `#B42318` | `#FF8A80` | `#B42318` | `#FF8A80` | `#A3261A` | `#FF9A85` |
| `--danger-ink` | `#FFFFFF` | `#0F2A52` | `#FFFFFF` | `#10161F` | `#FFFFFF` | `#2B2219` |
| `--success` | `#1F7A4D` | `#7FD8A4` | `#1F7A4D` | `#7FD8A4` | `#2E6B3A` | `#9ED39A` |

`tests/theme.test.ts` parses the three CSS files and asserts: all 11 tokens present per theme and mode; `WINDOW_BG` equals `--bg`; `--text` and `--text-muted` on `--surface` and `--surface-raised` >= 4.5; `--accent-ink` on `--accent` and `--danger-ink` on `--danger` >= 4.5; `--accent`, `--danger`, `--success` on `--surface` >= 4.5 (they are used as text). Exception the test documents: Vellum `--text-muted` on `--bg` is 4.3:1, so muted text sits on surfaces only (section 4).

### 1.7 Common components (owner C)

Kept APIs (restyled; one change each where noted):

```ts
Button(p: ButtonHTMLAttributes & { variant?: "primary" | "quiet" | "link" | "danger"; icon?: IconName })
IconButton(p: ButtonHTMLAttributes & { icon: IconName; label: string; active?: boolean })
Icon(p: { name: IconName; size?: number })                      // default size 20
Kbd(p: { k: string })
Panel(p: HTMLAttributes & { onDismiss?: () => void; dismissOutside?: boolean });  PanelHeader(p: { title; children? })
Segmented<T>(p: { options: { value: T; label: string }[]; value: T; label: string; onChange(v: T): void })
Slider(p: { value; min?; max; step?; keyStep?; buffered?; label; className?; onChange; tooltip?; valueText? })
Switch(p: { checked: boolean; label: string; onChange(on: boolean): void })
Dropdown<T>(p: { icon?; className?; label; options; selected: T; buttonText?; onSelect(v: T): void;
  placement?: "below" | "above" })                              // new, default "below"
// Toast.tsx (types move here from the deleted renderer/types/player.ts)
export type ToastKind = "info" | "success" | "error";
export interface ToastAction { label: string; run: () => void }  // e.g. Undo
export interface ToastItem { id: number; kind: ToastKind; message: string; action?: ToastAction }
export function useToasts(): { items: ToastItem[]; push(kind: ToastKind, message: string, action?: ToastAction): void; dismiss(id: number): void };
export function ToastHost(p: { items: ToastItem[]; onDismiss(id: number): void })   // 4 s, 6 s with an action
```

New primitives (each has 3+ uses below):

```ts
TextField(p: Omit<InputHTMLAttributes, "onChange"> & { label: string; hideLabel?: boolean; value: string;
  onChange(v: string): void; onEnter?(): void; type?: "text" | "search" | "number" })
  // Notes search, Tasks add, Clipboard label, Timer label, Palette, Settings accent hex
TextArea(p: Omit<TextareaHTMLAttributes, "onChange"> & { label: string; hideLabel?: boolean; value: string;
  onChange(v: string): void; mono?: boolean })                  // Notes body, Snippet text, Editor
Field(p: { label: string; hint?: string; htmlFor?: string; children: ReactNode })  // label + control + hint row
Dialog(p: { title: string; onClose(): void; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" })
  // focus in on open, Tab stays inside, focus back on close; useDismiss; confirm, palette, shortcut help, import
EmptyState(p: { icon?: IconName; title: string; body?: string; action?: ReactNode })  // every demo + stubs
List(p: HTMLAttributes<HTMLUListElement> & { label: string });
ListRow(p: { selected?: boolean; onSelect?(): void; leading?: ReactNode; title: ReactNode; meta?: ReactNode;
  trailing?: ReactNode })                                       // notes, tasks, snippets, news, recents, palette
Toolbar(p: { label: string; children: ReactNode })              // role="toolbar", arrow keys not managed
SplitPane(p: { start: ReactNode; end: ReactNode; startWidth?: string; label?: string })  // CSS grid, no drag
Spinner(p: { label: string })                                   // news, system, player, app loading
```

Checkboxes are native `<input type="checkbox" class="checkbox">` with `accent-color: var(--accent)`; no component.

CSS (owner C, all in `renderer/styles/`, imported by `renderer/styles/index.css`): `base.css` (reset, body, `.visually-hidden`, focus), `controls.css` (`.btn`, `.btn-primary|quiet|link|danger`, `.icon-btn`, `.switch`, `.segmented`, `.slider`, `kbd`, `.text-field`, `.text-area`, `.text-area.is-mono`, `.field`, `.checkbox`), `overlays.css` (`.panel`, `.dropdown`, `.dropdown-menu`, `.dialog-backdrop`, `.dialog`, `.dialog-head`, `.dialog-body`, `.dialog-foot`, `.toast-host`, `.toast`, `.toast-<kind>`), `layout.css` (`.list`, `.list-row`, `.list-row-leading|title|meta|trailing`, `.toolbar`, `.split-pane`, `.empty-state`, `.spinner`). Convention: block class = component name in kebab case, parts `<block>-<part>`, state `is-<state>` (`is-selected`, `is-active`, `is-on`, `is-mono`). Shell CSS is `renderer/shell/shell.css` (D); a demo's is `renderer/apps/<id>/<id>.css` with classes prefixed `<id>-`; settings is `renderer/settings/settings.css`.

Icons (`Icon.tsx`, 24 px viewBox, filled paths, owner C): app icons `notes tasks editor clipboard timer system news player`; shell `home settings search palette keyboard sun moon monitor back close`; actions `plus trash pin check copy save folder refresh external undo chevronUp chevronDown warning info`; player `play pause fullscreen exitFullscreen volume mute`. Drop the rest.

### 1.8 Main features (owner E unless noted)

```ts
// electron/features/logger.ts            userData/logs/main.log, rotates at 1 MB to main.old.log; console in dev
export const log: { info(scope: string, msg: string, extra?: unknown): void; warn(...): void; error(...): void };
// electron/features/links.ts
export function openLink(key: LinkKey): void;
export function openExternalHttps(url: string): boolean;   // false unless new URL(url).protocol === "https:"
export function setAboutPanel(): void;
// electron/features/notifications.ts     no-op when !Notification.isSupported() or settings.notifications is off
export function notify(o: { title: string; body: string; onClick?: () => void }): void;
// electron/features/tray.ts             icon from assetPath("tray.png"); menu: Show <name>, status line, Quit
export function createTray(): void;
export function setTrayStatus(text: string | null): void;  // tooltip, macOS title, disabled status item
export function hasTray(): boolean;
// electron/features/deepLink.ts + pure deepLinkParse.ts
export function parseDeepLink(url: string): DeepLink | null;
export function registerDeepLinks(onLink: (l: DeepLink) => void): void; // setAsDefaultProtocolClient, open-url, argv
// electron/features/net.ts
export const NET_HOSTS = ["hacker-news.firebaseio.com"] as const;
export class NetError extends Error { kind: "offline" | "timeout" | "http" | "blocked" | "parse" }
export function isAllowedUrl(url: string): boolean;         // https and host in NET_HOSTS; pure, tested
export function fetchJson<T>(url: string, heal: (raw: unknown) => T, o?: { timeoutMs?: number }): Promise<T>; // net.fetch, 10 s
// electron/features/files.ts            the only place that turns a path into a handle
export function pickOpenFile(o: { title: string; filters: FileFilter[] }): Promise<string | null>;
export function pickSaveFile(o: { title: string; defaultName: string; filters: FileFilter[] }): Promise<string | null>;
export function readTextFile(path: string, maxBytes: number): string;      // throws "Too large" / "Not a text file"
export function writeTextFile(path: string, text: string): void;           // temp + rename
export function fileHandle(path: string): string;  export function pathOf(fileId: string): string | null;
export function openTextFile(path: string): OpenedFile;   // .md .markdown .txt, 2 MB; adds a recent
export function queueLaunchFile(path: string): void;      // launch arg / second instance: pending + app:deep-link editor
export function takePendingFile(): OpenedFile | null;
// electron/features/recents.ts (+ recentsShape.ts kept)
export function listRecents(): RecentView[];  export function recentPath(id: string): string | null;
export function addRecent(path: string): void;  export function onRecentsChanged(cb: () => void): () => void;
// electron/features/powerSave.ts kept: setPreventSleep(on)
// electron/features/assets.ts: assetPath(name) -> build/<name> in dev, process.resourcesPath/<name> packaged
// electron/features/media.ts (seeded by E as no-ops, filled by the Player builder)
export function registerMediaScheme(): void;               // before app ready
export function registerMediaProtocol(): void;              // after ready; Range support from f4ff043 serveFile
export function serveOnly(path: string): MediaFile;         // new random token, replaces the previous one
export function clearServed(): void;
```

`main.ts` (E): single-instance lock; `registerMediaScheme()`; `second-instance` shows the window and routes argv (deep link or `.md` path); `open-url`, `open-file` (macOS); `activate` recreates the window (macOS); `window-all-closed` quits except on macOS; Windows `setAppUserModelId(brand.appId)`; on ready: settings, `registerMediaProtocol`, `registerIpc`, `createWindow`, `createTray`, `buildMenu`, `registerDeepLinks`. `window.ts` (E): state from `loadWindowState` + `fitToDisplays`, min 720x480, `show: false`, theme background, sandbox flags and permission handlers as today, close guard and close-to-tray. `devCapture.ts` (A): env prefix `APP_` (`APP_CAPTURE`, `APP_CAPTURE_KEYS`, …, `APP_WINDOW_BOUNDS`). CSP (A, `vite.config.ts`): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src ${brand.mediaScheme}: blob:`.

### 1.9 Shell layout (owner D)

```html
<div class="shell" data-view="home | app | settings">          <!-- grid: rows titlebar / 1fr / footer -->
  <header class="titlebar">                                     <!-- in-page header; native window frame kept -->
    <span class="titlebar-name">Notes</span>                    <!-- brand.name on home -->
    <div class="titlebar-actions">palette · mode · settings IconButtons</div>
  </header>
  <nav class="rail" aria-label="Sheets">                        <!-- absent on home -->
    home IconButton · one IconButton per app (registry order, is-active) · spacer · settings
  </nav>
  <main class="shell-content" id="content">                     <!-- the box an app renders into -->
    <div class="app-root notes">…</div>
  </main>
  <footer class="shell-footer"><aside class="title-block" aria-label="Sheet details">
    <span class="title-block-name"/><span class="title-block-sheet">Sheet 3 of 8</span>
    <span class="title-block-count">12 notes</span><span class="title-block-state">Saved</span>
  </aside></footer>
  <div class="toast-host"/>  <!-- dialogs portal-free, rendered last -->
</div>
```

Grid: `grid-template-columns: var(--rail-w) 1fr` (`1fr` on home), rows `var(--titlebar-h) 1fr var(--footer-h)`; the footer spans the width with the title block at its right end, so it never covers content. `.shell-content` is `position: relative; min-width: 0; min-height: 0; overflow: hidden`. **The app contract:** the root element is `<div class="app-root <id>">` at 100% width and height, and the app owns scrolling inside it. Smallest box: 664 x 392 px (720 x 480 window). Long reading content is capped at `--content-max`.

Home (`renderer/shell/Home.tsx`): `.home` with the drafting grid background; `.home-head` (h1 brand name, tagline); `<ol class="sheet-index">` of `<li><button class="sheet-row">` with `.sheet-num` ("01"), `.sheet-name`, `.sheet-summary`, `.sheet-key` (Kbd for CmdOrCtrl+n). Up/Down move focus between rows, Enter opens. Title block on home: brand name, "Sheet index", "8 sheets", version. On settings: "Settings", version.

Palette (`renderer/shell/CommandPalette.tsx`): `Dialog size="md"` with a `TextField type="search"` and a `List` of `ListRow`s; `filterCommands(query, commands)` in `renderer/shell/paletteFilter.ts` (pure, tested: word-prefix match on label and group, shell first). Runs only commands with a live handler.

## 2. Per-demo specs (Phase 3)

Common to all: own `renderer/apps/<id>/` (including the seeded `index.ts` and component), `tests/apps/<id>*.test.ts`, and the part files named below. Use `useTitleInfo` for count and save state, `EmptyState` with an action for the empty screen, `toast("error", …)` with what happened and what to do. Copy is sentence case with plain verbs.

**Notes** (`notes`, icon `notes`). CRUD through `useCollection("notes")`, search, debounced autosave. `SplitPane`: list (search `TextField`, pinned first then `updatedAt` desc) and editor (title `TextField`, body `TextArea`). Typing updates a local draft; save 500 ms after the last keystroke and on blur/unmount; title block shows saving/saved/error. Deep link `recordId` selects a note. Files: `index.ts`, `NotesApp.tsx`, `NoteList.tsx`, `NoteEditor.tsx`, `notesModel.ts`, `notes.css`. Commands: `notes.new` (CmdOrCtrl+N), `notes.search` (`/`), `notes.delete` (`Delete`, confirm), `notes.pin`. Pure, tested: `filterNotes`, `sortNotes`, `displayTitle` (first line when title empty). States: loading, empty ("Write your first note"), no matches, error. Edits `shared/collections/notes.ts` only to add fields. Budget: 5 files, 450 lines.

**Tasks** (`tasks`, icon `tasks`). CRUD, filters, reorder, undo. Add row (`TextField`, Enter adds), filter `Segmented` (All / Active / Done), `List` of rows with a checkbox, title, optional due date, move up/down `IconButton`s. Delete shows a toast with Undo (`restore(removed)`). Commands: `tasks.new` (`n`), `tasks.clearDone` (confirm, undo of a batch is out of scope), `tasks.filterAll|Active|Done` (`1` `2` `3`). Pure, tested: `visibleTasks(tasks, filter)`, `moveId(ids, id, delta)`, `taskCounts`. States: loading, empty, all done, error. Budget: 4 files, 400 lines.

**Editor** (`editor`, icon `editor`). Open/save dialogs, recents, drag-and-drop, unsaved guard, `.md` association, Markdown preview. `SplitPane`: `TextArea mono` and preview (`markdown-it`, `html: false`, `linkify: true`, rendered into a `div` via `dangerouslySetInnerHTML`; links are not followed). Toolbar with New, Open, Save, recents `Dropdown`, preview toggle. On mount: `editor:take-pending`, then listen to `editor:opened`. Drop on the app root → `window.app.drop("editor:open-dropped", files)`. `useNavigationGuard` while dirty. Files: renderer `index.ts EditorApp.tsx EditorToolbar.tsx editorModel.ts markdown.ts markdown-it.d.ts editor.css`; `shared/ipc/editor.ts`; `electron/ipc/editor.ts` (uses `features/files.ts` and `recents.ts`, no new feature file). Commands: `editor.new` (CmdOrCtrl+N), `editor.open` (CmdOrCtrl+O), `editor.save` (CmdOrCtrl+S), `editor.saveAs` (CmdOrCtrl+Shift+S), `editor.preview` (CmdOrCtrl+E). Pure, tested: `editorReducer` (opened, edited, saved, new; `dirty = text !== savedText`), `untitledName`. States: no file (empty state with Open and New), too large / not text (toast), save failed (keep text, toast). Budget: 7 files, 500 lines.

**Clipboard** (`clipboard`, icon `clipboard`). System clipboard read/write and saved snippets (`useCollection("snippets")`). Top: current clipboard text (read on "Read clipboard" only, never on a timer) with "Save as snippet". Below: snippet list with Copy, Edit (Dialog with label `TextField` + `TextArea`), Delete. Files: renderer `index.ts ClipboardApp.tsx SnippetDialog.tsx snippetsModel.ts clipboard.css`; `shared/ipc/clipboard.ts`; `electron/ipc/clipboard.ts` (Electron `clipboard`, plain text only). Commands: `clipboard.read` (`r`), `clipboard.newSnippet` (CmdOrCtrl+N). Pure, tested: `labelFrom(text)` (first line, 60 chars), `filterSnippets`. States: empty clipboard, no snippets, limit reached (toast). Budget: 6 files, 380 lines.

**Timer** (`timer`, icon `timer`). Main-owned state, notifications, tray. Large `mm:ss` (tabular figures, `--font-display`), label `TextField`, presets 25 / 5 / 15 min as `Segmented`, custom minutes, Start / Pause / Resume / Reset. While running, the renderer redraws from `endsAt` on a 250 ms interval; the truth comes from `timer:changed`. Main: `electron/features/timer.ts` (one `setTimeout` to `endsAt`; while running, `setTrayStatus("12:04 left")` every second; on done `notify` and `setTrayStatus(null)`), pure `electron/features/timerModel.ts`. Commands: `timer.toggle` (` `), `timer.reset` (`r`). Pure, tested: `timerReducer(state, action, now)`, `remainingMs(state, now)`, minutes clamp 1..180. States: idle, running, paused, done ("Time's up" + Start again). Budget: renderer 3 files 250 lines; main 3 files 200 lines.

**System info** (`system`, icon `system`). Live data pushed from main while subscribed. Static rows (OS, CPU, cores, memory, versions) and live rows (CPU %, memory used with a bar, app memory, uptime, load average). `system:subscribe` on mount, `system:unsubscribe` on unmount; main stops on unsubscribe, window hide/minimise and window close, so nothing runs while nobody watches. Main: `electron/features/systemInfo.ts` + pure `systemModel.ts` (`cpuPercent(prev, next)` from `os.cpus()` times). Renderer pure: `formatUptime`, use existing `formatBytes`. Commands: none beyond go. States: loading, error. Budget: renderer 3 files 220 lines; main 3 files 180 lines.

**News** (`news`, icon `news`). Hacker News through main, cache, loading/offline/error, external links. Feed `Segmented`, Refresh, list of 30 stories (title, host, score, comments, age). Row click → `news:open(id, "article")`, meta button → `"comments"`; main looks the URL up in its cache and opens it with `openExternalHttps` (comments: `https://news.ycombinator.com/item?id=<id>`). Main: `electron/features/news.ts` (feed ids + 30 items, 6 at a time, through `fetchJson`), pure `newsModel.ts` (`healItem`, `hostOf`, `isFresh(fetchedAt, now)` with 5 min TTL), cache in memory and in `news-cache.json` so offline after a restart still shows stories. Commands: `news.refresh` (`r`), `news.top|new|best` (`1` `2` `3`). Renderer pure: `relativeTime(sec, now)`. States: loading (spinner), offline with cache (notice "You're offline. Showing stories from 10:42."), offline without cache, HTTP error, empty. Budget: renderer 4 files 300 lines; main 3 files 250 lines.

**Player** (`player`, icon `player`). Custom file protocol, allowlist, fullscreen. Open button / drop → `MediaFile`; `<video src={url}>` with slim custom controls (play, `Slider` seek, time, volume, fullscreen via `useFullscreen` on the app root). Restore and trim from `f4ff043`: `SeekBar`, `TimeDisplay`, `VolumeControl`, `usePlayerState`, `serveFile` and `parseRange` from `protocol.ts`, `allowlist.ts`. Native only: extensions `mp4 m4v webm mov ogv mp3 m4a ogg wav flac`; anything Chromium cannot decode shows an error, no ffmpeg. `player:set-playing` drives `setPreventSleep`. `player:close` on unmount clears the allowlist. Files: renderer `index.ts PlayerApp.tsx PlayerControls.tsx usePlayback.ts playerModel.ts player.css`; main `electron/features/media.ts` (+ `mediaRange.ts` pure: `parseRange`), `electron/ipc/player.ts`. Commands: `player.open` (CmdOrCtrl+O), `player.togglePlay` (` `), `player.back` (`ArrowLeft`), `player.forward` (`ArrowRight`), `player.fullscreen` (`f`), `player.mute` (`m`). Pure, tested: `parseRange`, `isMediaExtension`, `formatTime` reuse. States: nothing open, decode error, file vanished. Budget: renderer 6 files 450 lines; main 3 files 220 lines.

**Settings** (`renderer/settings/`, not a demo, route `settings`). Sections as `Field` rows: Appearance (three theme cards with swatches of their own tokens, `data-theme` set on each card; mode `Segmented`; accent `<input type="color">` + hex `TextField` + "Use theme accent"; a warning when `contrastRatio(accent, surface) < 4.5`), Behaviour (`Switch` close to tray, with the note "Needs a visible tray icon"; `Switch` notifications), Data (Export, Import with confirm, Show data folder, Reset with a danger confirm), About (name, version, Electron/Chrome versions from `app:info`, website and issues via `links:open`, third-party credits from `utils/credits.ts`, latest changelog headings from `utils/changelog.ts`). "Theme editor" here means theme + mode + accent, not editing tokens. Files: `SettingsScreen.tsx AppearanceSection.tsx DataSection.tsx AboutSection.tsx settings.css`. Pure, tested: nothing new beyond B's `healSettingsPatch` and C's `color.ts`. Budget: 5 files, 450 lines.

## 3. Path ownership

Wave 0 (A) seeds every file marked `seed` and the stubs below; after that, ownership is this table. "Stub" = created in Phase 2 with a placeholder body, handed to the Phase 3 owner.

| Builder | Paths |
|---|---|
| **A** brand and identity | `shared/brand.ts`, `shared/superseded.ts`, `package.json` (all dependency changes: add `markdown-it`, `@fontsource/barlow`, `@fontsource/barlow-condensed`; remove `@fontsource-variable/archivo`, `@fontsource/press-start-2p`; name, productName, description, homepage, repository, desktopName), `pnpm-lock.yaml`, `electron-builder.yml` (appId, productName, `protocols: [{name, schemes: [app-template]}]`, Linux `mimeTypes: [text/markdown, x-scheme-handler/app-template]`, `fileAssociations` md, `extraResources` tray icon, Windows and macOS targets), `vite.config.ts`, `tsconfig.json`, `tsconfig.electron.json`, `scripts/*`, `renderer/index.html`, `electron/devCapture.ts`, `build/icons/*` + `build/tray.png`, `tests/brand.test.ts`, `tests/superseded.test.ts`. Wave 0 seed commit. |
| **B** IPC and storage | `shared/ipc/{define,index,data,settings}.ts`, seeds of `shared/ipc/{editor,clipboard,timer,system,news,player}.ts`, `shared/collections/*`, `shared/settings.ts`, `shared/types.ts` (delete; move `RecentFile` to `electron/features/recentsShape.ts`), `electron/preload.ts`, `electron/ipc/{handle,validate,index,data,settings}.ts`, stubs `electron/ipc/{editor,clipboard,timer,system,news,player}.ts`, `electron/store/*` (`jsonStore` moved here), delete `electron/ipc.ts`, `electron/jsonStore.ts`, `renderer/global.d.ts`, `renderer/hooks/{useCollection,useSettings,useAppEvent}.ts`, `renderer/utils/platform.ts`, `tests/ipc.test.ts`, `tests/validate.test.ts`, `tests/store/*`. |
| **C** theme and components | `shared/theme.ts`, `renderer/theme/*`, `renderer/styles/*` (delete player-only CSS), `renderer/components/common/*` (all 10 + 9 new), `renderer/hooks/{useDismiss,useLatest,useFullscreen}.ts`, `renderer/utils/{format,step}.ts`, delete `renderer/types/player.ts`, `tests/theme.test.ts`, `tests/color.test.ts`, `tests/format.test.ts`. |
| **D** shell and registry | `shared/commands.ts`, `renderer/main.tsx`, `renderer/App.tsx`, `renderer/shell/*` (AppShell, TitleBar, Rail, TitleBlock, Home, CommandPalette, ShortcutHelp (moved from components), ErrorBoundary, ShellContext, router, commandTable, paletteFilter, useShellCommands, shell.css), `renderer/hooks/useShortcuts.ts` (delete `usePlayerShortcuts.ts`), `renderer/apps/types.ts`, `renderer/apps/registry.ts`, stubs `renderer/apps/<id>/{index.ts,<Name>App.tsx}` for all 8, stub `renderer/settings/SettingsScreen.tsx`, `renderer/utils/{changelog,credits,dropItems,windowActivity}.ts`, delete `renderer/components/{TopBar,ShortcutHelp}.tsx`, `tests/{router,commandTable,paletteFilter,commands,registry,changelog,dropItems}.test.ts`. |
| **E** main process | `shared/ipc/app.ts`, `electron/main.ts`, `electron/window.ts`, `electron/menu.ts` + pure `electron/menuTemplate.ts`, `electron/ipc/app.ts`, `electron/features/{logger,links,notifications,tray,deepLink,deepLinkParse,net,files,recents,recentsShape,powerSave,assets}.ts`, stub `electron/features/media.ts`, delete `electron/{links,recents,recentsShape,powerSave}.ts` (moved), `tests/main/{deepLink,net,menuTemplate,recentsShape,files}.test.ts`. |
| Notes | `renderer/apps/notes/*`, `shared/collections/notes.ts` (fields only), `tests/apps/notes*.test.ts` |
| Tasks | `renderer/apps/tasks/*`, `shared/collections/tasks.ts` (fields only), `tests/apps/tasks*.test.ts` |
| Editor | `renderer/apps/editor/*`, `shared/ipc/editor.ts`, `electron/ipc/editor.ts`, `tests/apps/editor*.test.ts` |
| Clipboard | `renderer/apps/clipboard/*`, `shared/ipc/clipboard.ts`, `electron/ipc/clipboard.ts`, `shared/collections/snippets.ts` (fields only), `tests/apps/clipboard*.test.ts` |
| Timer | `renderer/apps/timer/*`, `shared/ipc/timer.ts`, `electron/ipc/timer.ts`, `electron/features/{timer,timerModel}.ts`, `tests/apps/timer*.test.ts` |
| System info | `renderer/apps/system/*`, `shared/ipc/system.ts`, `electron/ipc/system.ts`, `electron/features/{systemInfo,systemModel}.ts`, `tests/apps/system*.test.ts` |
| News | `renderer/apps/news/*`, `shared/ipc/news.ts`, `electron/ipc/news.ts`, `electron/features/{news,newsModel}.ts`, `tests/apps/news*.test.ts` |
| Player | `renderer/apps/player/*`, `shared/ipc/player.ts`, `electron/ipc/player.ts`, `electron/features/{media,mediaRange}.ts`, `tests/apps/player*.test.ts` |
| Settings | `renderer/settings/*`, `tests/settings*.test.ts` |

Order constraints:
1. Wave 0 (A) lands before anyone starts. It includes all `seed` blocks, the stub files of B, D and E, and `renderer/global.d.ts`, so every branch typechecks.
2. Phase 2 merges A, B, C, E, D. D merges last because the shell consumes every other builder's surface; D codes against the contracts, not against other branches.
3. `pnpm build` and a devCapture screenshot of home and one stub sheet close Phase 2.
4. Phase 3 starts from merged Phase 2. Its builders never edit `shared/ipc/index.ts`, `electron/ipc/index.ts`, `renderer/apps/registry.ts`, `preload.ts`, `menu.ts`, `main.ts` or `package.json`. Need something there? Say so in the report.

## 4. Risks and open questions

1. **"Delete a demo = folder + one registry line" holds only for Notes and Tasks.** Main-backed demos also have `shared/ipc/<id>.ts`, `electron/ipc/<id>.ts`, `electron/features/<id>*.ts` and one line in each of the two index files. Proposal: accept it, and list the delete steps per demo in `docs/guides/remove-a-demo.md`.
2. **The per-app native menu and the Go menu come from the renderer** (`menu:set-context`), so renderer-supplied labels and accelerators reach a native menu. Validated in main and low risk, but it is untrusted text in native UI. The alternative (a static menu without app commands) loses a teaching point. Reviewer should confirm.
3. **Spec colours vs AA:** Vellum `--text-muted` on `--bg` is 4.3:1 (passes on `--surface`); Vellum `--line` on `--surface` is about 2.1:1, below 3:1 for control boundaries. Hence `--control-border: var(--text-muted)` and "muted text only on surfaces". A darker spec value would be cleaner; this is Alec's call.
4. **Tray on Linux** needs AppIndicator support (GNOME needs an extension), and Electron cannot tell whether the icon is visible. With close-to-tray on and no visible tray, the window looks lost. Mitigations: default off, second launch re-shows the window, the setting carries a note. A person must check on the target desktop.
5. **`markdown-it` types:** `@types/markdown-it` is outside the allowed dependency list, so Editor ships a 10-line `markdown-it.d.ts`. Add the types package instead?
6. **Window position on Wayland** cannot be restored (the compositor places windows); only size and maximised restore. `fitToDisplays` handles stale positions on X11, Windows and macOS (untested).
7. **Accent override** can fail contrast; Settings warns but allows it. Should it refuse instead?
8. **Ctrl+N / Ctrl+O are per-app** (Notes, Clipboard and Editor each claim Ctrl+N; Editor and Player Ctrl+O). Fine because only the active app's menu exists, but there is a short window after navigation before `menu:set-context` lands.
9. **`.md` association in the .deb** makes the template claim Markdown files on the developer's own machine once installed. Keep, or ship it commented out?
10. **Spec gaps decided here:** the spec's single `shared/ipc.ts` becomes the `shared/ipc/` folder (one part per feature, so parallel builders never share a file); `news-cache.json` is added to the stored files; "theme editor" is read as theme + mode + accent; the title bar is an in-page header under the native frame (no frameless window); the title block sits in a footer row rather than over content.
11. **Brand placeholders:** `links.website` is `https://example.com/` and the repo URL is a guess. Alec to supply.

Needs a person (cannot be verified by tests or screenshots): tray visibility and menu; notification look and click-through; deep links and `.md` opening on the installed `.deb`; theme following a live system light/dark change; close-to-tray and quit with unsaved Editor changes; drag-and-drop from a file manager; clipboard on Wayland; fullscreen in Player; keyboard focus order and the palette by keyboard alone; Windows and macOS builds at all.

## 5. Integrator's rulings on section 4

These override anything above that disagrees.

1. Deleting a main-backed demo takes several files. Accepted; `docs/guides/remove-a-demo.md` lists the steps.
2. The renderer-supplied menu context stays. Main validates ids against a pattern, caps label length and count, and accepts accelerators only in the `toAccelerator` output form.
3. Contrast: darken Vellum `--text-muted` until it passes 4.5:1 on both `--bg` and `--surface` (stay in the same blue-grey hue), and keep `--control-border` for control boundaries. `--line` keeps the spec value for decorative rules only.
4. Close-to-tray defaults to off, with the note in Settings.
5. Add `@types/markdown-it` as a dev dependency (builder A); no local declaration file.
6. Window position: as described.
7. Accent override: warn, do not refuse.
9. The `.md` file association ships commented out in `electron-builder.yml`, with a comment saying how to turn it on. The in-app open path (dialog, drop, recents, second-instance argument) is still built.
10. Spec gaps: all accepted.
11. Brand placeholders stay; the README tells the owner to set them.

Working method: every Phase 2 and Phase 3 builder works in its own git worktree and commits on its own branch; the integrator merges. Wave 0 is committed on the main line first.

## 6. As built

Where the built code differs from sections 1 to 5, the code wins. The differences, so a reader of this document is not misled:

1. **`editor:opened` is gone.** A file named by a second instance or at launch is announced by the shell as `app:deep-link` (`appId: "editor"`); the Editor listens for that and calls `editor:take-pending`, which hands over the file once.
2. **`player:is-open-file-present`** was added (`shared/ipc/player.ts`). After a playback error the Player asks main whether the served file still exists, to tell "the file is gone" from "the format is not supported".
3. **`hostname` was removed from `SystemInfo`.** The page does not need the machine name, so main no longer sends it.
4. **`shared/ipc/bridge.ts`** holds the `window.app` bridge types shared by `preload.ts` and `renderer/global.d.ts`.
5. **Pure cores are split from their Electron shells:** `electron/features/netCore.ts` (host allow-list, URL checks) and `electron/features/filesCore.ts` (extensions, text decoding, `HandleTable`, `displayFolder`), each next to the module that imports `electron`, so vitest can load them.
6. **`--accent-text` is a twelfth base token** (with `--accent`, `--accent-ink`): the accent as text or a thin line, nudged for contrast on the surface. `tests/theme.test.ts` checks it in every theme and mode.
7. **Icons are stroke icons** (`currentColor`, 1.75 stroke on a 24 grid), not filled glyphs.
8. **`ConfirmDialog`** (`renderer/shell/useConfirm.tsx`, reached as `useShell().confirm`) is the one confirmation dialog; apps never build their own.
9. **`ListRow`** takes an optional `secondary` line and `wrap`. Without `onSelect` the title is plain text, not a button (Tasks: the checkbox is the control).
10. **`TextField` and `TextArea`** take a `ref` to the inner element (React 19 ref-as-prop) and `invalid` (error border and `aria-invalid`); `TextField` also takes `type="date"`; `TextArea` takes `fill`.
11. **`Toolbar`** takes `end`, content pinned to the right edge. `Dropdown` takes `disabled` and handles an empty option list (it is disabled). `Button` and `IconButton` style `aria-pressed="true"` as the toggled state.
12. **`useCollection`** returns `reload()`, which reads a collection again after a failed load; Notes, Tasks and Clipboard offer it as "Try again".
13. **Theme scoping:** each theme block's selector is `:root[data-theme=…][data-mode=…], [data-theme=…][data-mode=…]`, and the derived colour tokens in `tokens.css` re-derive on any element with both attributes. The Settings swatches set the two attributes and nothing else; `?raw` parsing of theme CSS (`themeTokens.parseThemeTokens`, `themeSamples.ts`) was removed.
14. **New tokens:** `--fs-display` (the Timer clock) and `--media-bg` / `--media-ink`, a surface that is dark in every theme (the Player's picture area).
15. **Validators:** `v.object({ … })` checks a plain object field by field (`timer:start`, `news:list`).
16. **Layering:** main imports nothing from `renderer/`. The Player's file-type helpers (extension list, MIME map, unsupported message) live in `shared/mediaTypes.ts`, imported by both sides.
17. **Display paths:** `displayFolder` shows the home folder as `~` and elides the middle of a path longer than 40 characters (`~/…/redesign/notes`). The renderer never receives a longer absolute path than that.
18. **`devCapture.ts`** ends with `app.exit(0)` (it skips quit guards, so an unsaved Editor cannot hang a capture) and presses `APP_CAPTURE_KEYS` 400 ms apart, waiting for the last key before the screenshot.
19. **`useShortcuts`** exports `ignoresKey` (pure, tested): Space and Enter are left to a focused button, link or role control, and every key to text fields and modifier chords.
20. **Config:** `package.json` is at `0.1.0`. The `vite` and `vitest` scripts pass `--configLoader runner`, and `vite.config.ts` uses `import.meta.dirname`; this removes the Vite `configLoader: 'native'` warning without making the package `"type": "module"`.
