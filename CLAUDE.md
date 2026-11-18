# App Template

Starter for desktop apps (Electron 45, React 19, TypeScript strict, Vite 8, esbuild for the main process, vitest, pnpm 11). It opens on a "sheet index" (the home menu) that links to eight small demo apps, each teaching one desktop skill: Notes, Tasks, Editor, Clipboard, Timer, System info, News, Player. Around them is shared plumbing: three themes (Blueprint, Graphite, Kraft) in light and dark plus an accent override, typed IPC, a generic JSON collection store, a native menu generated from one command table, a tray, notifications, a command palette and a Settings sheet. The owner clones it to start new apps and to learn desktop development, so the code stays small and readable, and a demo is cut out by deleting its folder (see `docs/guides/remove-a-demo.md`). `website/` is a separate Astro product-site template (see [Website](#website)).

Terms: the **main process** is the Node side (`electron/`), which can touch files, the network and the OS. The **renderer** is the web page (`renderer/`), sandboxed and treated as untrusted. The **preload** script (`electron/preload.ts`) is the only bridge between them and exposes `window.app`. **IPC** is the message passing across that bridge.

Design: `docs/superpowers/specs/2026-11-17-app-template-design.md` (intent, decisions, non-goals). `docs/superpowers/plans/2026-11-17-foundation-contracts.md` is the build plan; its section 6 "As built" overrides the earlier sections, and the code overrides both. Task guides: `docs/guides/`.

## Commands

```bash
pnpm dev            # vite (port 5173, strict; APP_DEV_PORT=5199 pnpm dev for another) + esbuild watch + Electron
pnpm typecheck      # renderer/shared/tests tsconfig, then the electron tsconfig
pnpm test           # vitest (pure logic only; no Electron, no DOM)
pnpm build          # typecheck + renderer bundle (dist-renderer) + main bundle (dist-electron)
pnpm dist           # build + .deb in release/ (Linux x64)
pnpm dist:win       # build + NSIS installer (configured, never run; build it on Windows)
pnpm dist:mac       # build + dmg (configured, never run; build it on macOS)
node scripts/make-icons.mjs   # regenerate the placeholder icons (needs ImageMagick `convert`)
```

Run `pnpm typecheck && pnpm test` before every commit and check the exit status itself: piping a gate through `tail` or `grep` hides a failure. CI (`.github/workflows/ci.yml`) runs the same two on pushes to `main` and on pull requests. There is no lint or format script; follow the surrounding style (two spaces, double quotes, semicolons).

Website (its own checks; the root gates never see it, because the root `tsconfig.json` includes only `renderer`, `shared` and `tests`, and vitest only `tests/**/*.test.ts`):

```bash
pnpm --dir website install --frozen-lockfile
pnpm --dir website dev --background   # http://localhost:4321/electron-app-template/ ; dev status|logs|stop
pnpm --dir website check              # astro check
pnpm --dir website build              # website/dist
pnpm --dir website test:browser       # Playwright, two builds; own preview on :4321, or PREVIEW_PORT=4410
```

Build-script approval for dependencies lives in `pnpm-workspace.yaml` (`allowBuilds`).

## Layout

```
electron/                 main process (Node)
  main.ts window.ts menu.ts menuTemplate.ts   startup and lifecycle; window + close guard; native menu
                                              (menuTemplate.ts is pure: template and context checks)
  preload.ts              the bridge: window.app.{invoke,drop,on,platform,initialTheme}
  devCapture.ts           screenshot harness (not in packaged builds)
  ipc/                    handle.ts (handle, handleDrop, emit), validate.ts (v.* argument checks),
                          one register file per part: app data settings editor clipboard timer system news player; index.ts
  store/                  jsonStore.ts (atomic JSON files in userData), collection.ts + collectionCore.ts (generic CRUD),
                          settings.ts, windowState.ts + windowStateShape.ts, bundle.ts + dataTransfer.ts (export/import/reset)
  features/               appProtocol.ts + appServe.ts (serve the built page), media.ts + mediaRange.ts (Player's file scheme),
                          net.ts + netCore.ts (allowlisted fetch), news.ts + newsModel.ts, timer.ts + timerModel.ts,
                          systemInfo.ts + systemModel.ts, files.ts + filesCore.ts (dialogs, handles), recents.ts + recentsShape.ts,
                          deepLink.ts + deepLinkParse.ts, tray.ts, notifications.ts, logger.ts, links.ts, powerSave.ts, assets.ts, home.ts
shared/                   code both sides import; never imports electron or React
  brand.ts                name, ids, links, default theme: the one rebrand file
  ipc/                    define.ts (invoke/drop/event), one channel file per part, index.ts (IPC map + types), bridge.ts (window.app type)
  collections/            base.ts, heal.ts, notes.ts tasks.ts snippets.ts, index.ts (COLLECTIONS)
  commands.ts             shell commands, key/accelerator helpers (formatKey, toAccelerator, hint), MenuContext
  settings.ts theme.ts csp.ts mediaTypes.ts superseded.ts
renderer/
  main.tsx index.html App.tsx   entry: fonts, theme CSS, initial theme, <AppShell/>
  shell/                  AppShell, Home (sheet index), Rail, TitleBar, TitleBlock, CommandPalette, ShortcutHelp, ErrorBoundary,
                          ShellContext (hooks apps use), router.ts, handlerRegistry.ts, commandTable.ts, paletteFilter.ts,
                          useShellNav/useShellCommands/useShellEvents/useConfirm, shellModel.ts (pure), ipcSafe.ts
  apps/                   registry.ts (the list of demos), types.ts (AppDefinition), one folder per demo:
                          notes tasks editor clipboard timer system news player
  settings/               SettingsScreen + Appearance, ThemePicker, Data, About sections
  theme/                  tokens.css, themes/{blueprint,graphite,kraft}.css, index.css, useTheme.ts, color.ts (contrast maths)
  components/common/      Button Dialog Dropdown EmptyState Field Icon IconButton Kbd List Panel Segmented Slider Spinner
                          SplitPane Switch TextArea TextField Toast Toolbar
  hooks/                  useCollection useSettings useAppEvent useShortcuts useDismiss useFullscreen useLatest
  utils/                  changelog.ts and credits.ts (parse the bundled CHANGELOG.md and THIRD_PARTY_NOTICES.md), format, step, platform, errorMessage
  styles/                 base, controls, fields, overlays, layout, slider (all token-based)
tests/                    vitest; tests/apps/ for demo logic, tests/main/ and tests/store/ for main-side pure code
scripts/                  dev.mjs, build-electron.mjs, make-icons.mjs
build/                    icon.png, icons/<N>x<N>.png, tray.png (placeholders)
docs/guides/              task guides; docs/superpowers/: spec and plan
CHANGELOG.md THIRD_PARTY_NOTICES.md   both bundled into the app and parsed for Settings > About (formats below)
AGENTS.md TODO.md         short contributor guide; what is left to do
website/                  Astro 7 site template, own package.json and lockfile (config in src/config/)
.github/workflows/        ci.yml (typecheck + test), website-pages.yml (manual Pages deploy)
```

## How it fits together

- **Page origin and CSP.** The packaged page is never loaded from `file://`. `electron/features/appProtocol.ts` registers a privileged scheme `app-template-app://renderer/` (`brand.scheme` + `-app`, `shared/csp.ts`) and `appServe.ts` answers it from `dist-renderer`, confined to that folder (realpath check, GET and HEAD only, `nosniff`). The one Content-Security-Policy (CSP, the browser rule for what a page may load) is built by `buildCsp()` and sent as a response header on HTML: everything from `'self'`, `connect-src 'none'` (the page cannot use the network), `media-src` the media scheme plus `blob:`, fonts from `'self'` only, no `data:` fonts. In dev (`VITE_DEV_SERVER_URL` set by `scripts/dev.mjs`) the page comes from Vite on `http://localhost:5173` and `applyDevCsp` adds the dev variant of the same policy (allows the HMR websocket and an inline script). Custom schemes are registered with `protocol.registerSchemesAsPrivileged` once, before app ready (`main.ts`).
- **Window.** `window.ts`: `contextIsolation`, `sandbox`, no `nodeIntegration`; shown on `ready-to-show` with the theme's background colour (no flash); size and position saved in `window-state.json` and fitted to the connected displays; `APP_WINDOW_BOUNDS=1280x800` (or `x,y,w,h`) overrides the saved bounds (the comment in `window.ts` says it is ignored when packaged, but the code does not check that). `lockDownSession` grants only the `fullscreen` permission; `lockDownContents` blocks navigation, new windows and webviews. A single-instance lock sends a second launch's arguments to the first window.
- **Close guard.** An app calls `useNavigationGuard(message)` while it has unsaved work. That sets main's guard (`window:set-guard`); a window close or quit then emits `window:close-requested`, the shell asks with `ConfirmDialog`, and `window:confirm-close` lets it through. A crashed or hung page drops the guard so it cannot trap the app. With the setting `closeToTray` on (default off) and a tray that exists, closing hides the window instead.
- **IPC.** Every channel is declared once in `shared/ipc/<part>.ts` as `"part:verb": invoke<[args], Result>()`, `drop<Result>()` (renderer passes `File`s) or `event<Payload>()` (main to renderer), and merged in `shared/ipc/index.ts` (`IPC`, plus the types `ArgsOf`, `ResultOf`, `PayloadOf`). The preload refuses any channel name or kind that is not in `IPC`. In main, `electron/ipc/<part>.ts` has a `register()` that calls `handle(channel, validator, fn)`, listed in `electron/ipc/index.ts`. `handle` accepts only the main window's top frame, validates every argument with `v.*` (`validate.ts`), logs, and rethrows as a plain `Error(message)`. `emit(channel, payload)` pushes to the page; the page listens with `useAppEvent`. Drops: the preload turns `File`s into paths (`webUtils.getPathForFile`), `handleDrop` rechecks them (at most 32, absolute, existing regular files). Channel names are `<part>:<verb-kebab>` (`tests/ipc.test.ts`); the `app` part also holds `menu:`, `window:`, `log:` and `links:`.
- **Collections.** A collection is a list of records kept in `userData/<name>.json`. `shared/collections/<name>.ts` is a `CollectionSpec` (`name`, `version`, `max`, `heal`) listed in `COLLECTIONS`. Main's generic store (`store/collection.ts`) does list/create/update/remove/restore/reorder, assigns ids (16 hex) and timestamps, and pushes `data:changed`. The page uses `useCollection(name)`: the list changes only when that push arrives; mutations return promises. Records are addressed by id and every payload goes through the spec's `heal()`.
- **Settings and themes.** `shared/settings.ts` (`theme`, `mode`, `accent`, `closeToTray`, `notifications`), `store/settings.ts` in main, `useSetting(key)` in the page, `settings:changed` push. `shared/theme.ts` lists `THEMES` and `WINDOW_BG`; each theme is one CSS file in `renderer/theme/themes/` with the 12 base tokens for light and dark. `useTheme` sets `data-theme` and `data-mode` on `<html>`; mode `system` follows the OS through `nativeTheme`. The accent override recomputes `--accent-ink` and `--accent-text` for contrast. Main passes the first theme to the preload as `--app-theme=<theme>:<mode>` so the first paint is right.
- **Commands.** One table: `SHELL_COMMANDS` and `goCommands()` in `shared/commands.ts`, plus each app's `commands` in its `AppDefinition`. A command has `keys` (plain keys the page handles, shown in the menu as display-only) and/or `accelerator` (handled by the native menu, which sends `menu:command`). The same table drives the shortcut dispatcher (`useShortcuts`), the native menu (`menuTemplate.ts`; the page sends the active app's commands in `menu:set-context` and main validates them), tooltips (`hint()`), the palette and the `?` help. Handlers are registered with `useCommandHandlers` while an app is mounted; the palette lists only commands that have a handler. An accelerator-only command is reachable only through the menu or the palette.
- **Shell and registry.** `renderer/apps/registry.ts` (`APPS`) is the only list of demos; array order is the sheet number, the `Ctrl/Cmd+1..9` order (first nine) and the Go menu. Each demo is lazy loaded behind an `ErrorBoundary`. `router.ts` is a reducer over `home | settings | app(appId, recordId)`; an unknown app id goes home. Apps reach the shell through `ShellContext` hooks: `useShell` (navigate, toast, confirm, hint), `useTitleInfo` (count and save state in the title block), `useCommandHandlers`, `useNavigationGuard`.
- **Deep links.** `app-template://home`, `://settings`, `://open/<appId>[/<recordId>]` (`deepLinkParse.ts`, strict). A text file (`.md`, `.markdown`, `.txt`) on the command line is queued for the Editor. Links that arrive before the page says `app:ready` wait in a queue. `app.setAsDefaultProtocolClient` runs only when packaged.
- **Demos.** Notes: a collection, search, 500 ms debounced autosave. Tasks: a collection, filters, reorder, undo from a toast. Editor: open/save dialogs, recents, drop, unsaved-changes guard, Markdown preview with `markdown-it` (HTML disabled); the page holds opaque file ids, never paths. Clipboard: read and write the system clipboard through main, snippets in a collection. Timer: the state lives in main (`features/timer.ts`) so it survives leaving the sheet; it drives the tray text and a notification, and the page redraws from `endsAt`. System info: main samples every second only while the page is subscribed and the window is visible. News: Hacker News fetched by main, cached in `news-cache.json`, offline is a state not an error. Player: plays one chosen local file, native formats only.
- **Network through main.** `features/net.ts` `fetchJson` is the only way out: https, host in `NET_HOSTS` (`netCore.ts`), default port, no credentials, redirects refused, 2 MB cap, 10 s timeout, every failure a `NetError` with a fixed message. The page sends a story id, never a URL.
- **Media protocol.** `features/media.ts` serves exactly one file at a time at `app-template-media://file/<random token>` with byte-range support; the realpath and extension (`shared/mediaTypes.ts`) are checked when it is chosen. `media-src` in the CSP names that scheme.
- **Files.** Open and save dialogs run in main (`features/files.ts`). The page receives an opaque `fileId` and a display folder (`~/…/notes`), never an absolute path.

## Rules

- **One source of truth.** Brand in `shared/brand.ts` (`tests/brand.test.ts` checks `package.json` and `electron-builder.yml` against it). Channels in `shared/ipc/`. Commands in `shared/commands.ts` and the apps' `commands`; never hard-code a shortcut hint, use `hint()`. Colours, type, spacing, radii and layers in `renderer/theme/tokens.css` and the theme files. Collections in `shared/collections/`.
- **Tokens only.** No raw hex or rgba outside `renderer/theme/`; use the semantic tokens (`--bg --surface --text --line --accent ...`). Fonts are Barlow and Barlow Condensed from `@fontsource`, bundled, never from a CDN and never inlined as `data:` (the CSP has no `data:` in `font-src`; `vite.config.ts` stops Vite inlining font files).
- **Common components first.** Reuse `renderer/components/common/*` and the existing hooks before writing a new one. Extract a shared piece at the third use, not before. Apps never build their own confirm dialog (`useShell().confirm`).
- **File size.** Keep files under about 300 lines; split by responsibility.
- **Pure logic in tested modules.** Anything with branching goes in a pure module (`*Model.ts`, `*Core.ts`, `*Shape.ts`) with a test in `tests/`; hooks and components stay thin. Main files that import `electron` keep their pure part in a sibling so vitest can load it.
- **Layering.** `shared/` imports neither `electron` nor React. `electron/` never imports from `renderer/`. A demo's code is in `renderer/apps/<id>/` and, if it needs main, in `shared/ipc/<id>.ts`, `electron/ipc/<id>.ts` and `electron/features/<id>*.ts`.
- **New IPC** goes `shared/ipc/` then `electron/ipc/` (handler plus validators) and is typed on both sides by the same declaration. Never add a channel that takes a path, a URL or a command from the page.
- **Styling.** Sentence-case copy; 2 px radii; motion only in answer to an action and not under `prefers-reduced-motion`; visible keyboard focus. App CSS classes start with the app id (`notes-`, `timer-`).

## Security model

The renderer is sandboxed with context isolation and is treated as untrusted. Main validates everything it receives.

- **Sender:** only the main window's top frame can call a handler.
- **Arguments:** every `handle` has a validator (`v.string`, `v.int`, `v.oneOf`, `v.object`, `v.recordId`, `v.collection`, ...); anything unexpected is refused with `Invalid argument #n: expected ...`.
- **Paths:** the page never supplies a path. Files come from dialogs in main, from real drops resolved in the preload, or from the launch command line. Main hands out opaque ids and checks size and extension.
- **Collections:** addressed by an allowlisted name (`COLLECTIONS`), records by id, payloads through `heal()`.
- **Network:** only main, only `NET_HOSTS`, https only. The page's CSP has `connect-src 'none'` when packaged.
- **Media:** one file at a time, random token, extension check, realpath.
- **External links:** `links:open` takes a key of `brand.links`; News opens a story by id: main looks the URL up in its own cache and opens it only if it is https (`openExternalHttps`).
- **Menu:** the page's menu context is cut down by `sanitizeMenuContext` (id pattern, label length, counts, accelerator shape).
- **Session:** no permission but `fullscreen`; no navigation, popups or webviews.
- **Logging:** `log:write` is capped (2000 characters, 20 per minute) and line breaks are stripped.
- **System info** sends no host name, user name, paths or addresses.

## Concurrency rules

- Replaced requests are "superseded", not queued: a stale request throws `supersededError()` (`shared/superseded.ts`, marker `APP_SUPERSEDED`); callers treat `isSuperseded(e)` as "ignore silently" (no toast, no state change). News does this with a counter (`latest` in `features/news.ts`). After any `await` in main, re-check the counter before touching module state.
- In the page only the latest request may set state (check a request counter or an `alive` flag in the effect cleanup).
- Kill or clear whatever you supersede: timers (`shutdownTimer`), the served media file (`clearServed`), the power-save blocker (`setPreventSleep(false)`); these run from the real shutdown path in `main.ts`, not from `before-quit`, which an unsaved-changes guard can cancel.
- A dialog or `await` in a main handler can outlive the window: check `getWindow()` afterwards (`editor:save-as`, `data:import`).

## Stored data

JSON files in Electron's `userData` folder (Settings > Data > Show data folder opens it). File names match `^[a-z0-9-]+\.json$` (`store/jsonStore.ts`). Writes are atomic (temp file then rename); a failed write is reported, not swallowed.

| File | Shape | Written by |
| --- | --- | --- |
| `settings.json` | `{version, values}` | `store/settings.ts` |
| `window-state.json` | `{bounds, maximized}` | `store/windowState.ts` |
| `notes.json` `tasks.json` `snippets.json` | `{version, items}` | the collection store |
| `recents.json` | list of recent Editor files | `features/recents.ts` |
| `news-cache.json` | `{version, feeds}` | `features/news.ts` |
| `logs/main.log` | text; at 1 MB it moves to `main.old.log` | `features/logger.ts` |

- Every read goes through a `heal()` that takes `unknown`, so a hand-edited or stale file never crashes the app.
- **Collections and settings:** a file that is not valid JSON or not the expected envelope is "damaged". It is moved aside to `<name>.json.unreadable-<timestamp>` before the first write and the app carries on empty (or with defaults), so nothing is destroyed. A file whose `version` is higher than the code's is "newer": reads give an error (`These notes were saved by a newer version of the app`) or defaults, the file is never touched. Bump `version` in the spec only with a migration in `heal()`.
- **window-state, recents, news-cache:** a bad file reads as defaults and is overwritten on the next save.
- **Export/import** (`store/bundle.ts`): `{format: <packageName>, version: 1, exportedAt, settings, collections}`; import replaces only the collections and settings the file contains and heals them.

## Verifying without a person

`electron/devCapture.ts` (off when packaged) screenshots the window and quits. Variables use `brand.envPrefix` (`APP`):

| Variable | Meaning |
| --- | --- |
| `APP_CAPTURE=<png>` | turn capture on; write the screenshot there |
| `APP_CAPTURE_DELAY=3000` | ms before the screenshot (at least enough for the keys) |
| `APP_CAPTURE_SIZE=1280x800` | content size (check the PNG; the compositor may not honour it) |
| `APP_CAPTURE_KEYS=a,Down` | keys to press, comma separated, one second after load, 400 ms apart |
| `APP_CAPTURE_EVAL=<js>` | expression run in the page before the screenshot; logged as `[eval] ...` |
| `APP_WINDOW_BOUNDS`, `APP_LOG_LEVEL` (`warn`, `error`) | window size override; log threshold |
| `APP_PLAYER_FILE=/path/clip.mp4` | dev stand-in for the Player's open dialog (same checks) |

```bash
pnpm exec vite build --configLoader runner && pnpm build:electron     # no dev server, so port 5173 is not needed
S=$(mktemp -d)                                                        # throwaway profile
echo '{"version":1,"items":[{"id":"0123456789abcdef","title":"Seeded","body":"Hi","pinned":false,"createdAt":1,"updatedAt":1}]}' > $S/notes.json
APP_CAPTURE=$S/out.png APP_CAPTURE_SIZE=1280x800 APP_CAPTURE_DELAY=4000 \
APP_CAPTURE_EVAL='document.title' \
  pnpm exec electron --no-sandbox --user-data-dir=$S . app-template://open/notes
```

- Always pass `--user-data-dir`: it keeps your real data out of the capture, and the single-instance lock is per profile, so a capture still runs while a dev copy is open. Seed a profile by writing `notes.json`, `tasks.json`, `snippets.json` or `settings.json` there before launching (shapes above; ids are 16 hex characters).
- A deep link or a `.md` file as the last argument opens that sheet or the Editor. `pnpm dev` needs its port free (`strictPort`; it stops with a message if not, and `APP_DEV_PORT` picks another); building first and running `electron .` avoids the dev server.
- `--no-sandbox` is needed in dev on Linux because the npm-installed `chrome-sandbox` is not setuid root; `pnpm dev` adds it when needed. The packaged `.deb` is meant to run sandboxed.
- Keys are sent as Electron key codes: single characters (`n`, `?`, `shift+/`) work; check others (`Down`, `Tab`, `Return`) against the result. Shortcuts are ignored while a text field has focus.
- Light/dark: the window follows the OS; set it by seeding `settings.json` with `{"version":1,"values":{"theme":"kraft","mode":"dark"}}`.
- The capture ends with `app.exit(0)`, which skips quit guards, so an unsaved Editor cannot hang it.

## Adding an app

Full steps: `docs/guides/add-an-app.md`. In short: a folder `renderer/apps/<id>/` with `index.ts` (an `AppDefinition`: `id`, `name`, `icon`, `summary`, lazy `component`, optional `commands`), a default-exported `<Id>App.tsx`, CSS with the id as prefix and a pure model with a test; an icon path in `components/common/Icon.tsx`; one import and one array entry in `renderer/apps/registry.ts`; update the expected id list in `tests/registry.test.ts`. Needs saved records: add a collection (`docs/guides/add-a-stored-collection.md`). Needs main: add channels (`docs/guides/add-an-ipc-channel.md`).

## Removing a demo

`docs/guides/remove-a-demo.md` has a checklist per demo. The registry line is the visible part; main-backed demos (Editor, Clipboard, Timer, System info, News, Player) also have IPC, feature files and index lines, and a few shared files mention them (`electron/features/files.ts` names the Editor, `store/dataTransfer.ts` imports News and Recents, `tests/registry.test.ts` lists all eight).

## Website

`website/` is a rebrandable Astro site for the app. `website/README.md` is its guide; `website/AGENTS.md` is Astro boilerplate.

- **Separate project.** Own pnpm workspace and lockfile: `pnpm --dir website ...`; never add site dependencies to the root or app dependencies to the site.
- **Config, not pages.** Product facts, deploy defaults, copy and form text live in `website/src/config/` (`product.ts`, `deploy.ts`, `site.ts`, `content.ts`, `forms.ts`, `pages/*.ts`). The installer script served at `<base>/install.sh` is generated from that config (`src/pages/install.sh.ts`), not hand-written.
- **Base path.** The site is served under `SITE_BASE` (default `/electron-app-template`, from `deploy.ts`); every link and asset goes through `url()` in `src/config/site.ts`. `SITE_URL` is the origin only.
- **Forms.** Web3Forms with `PUBLIC_WEB3FORMS_ACCESS_KEY`, a public key by design (it ends up in the HTML). Env only (`website/.env`, gitignored). No key means the forms render as unavailable, and that path is tested. Signup requires consent.
- **Tests.** `test:browser` builds twice (dummy key with mocked submissions, then no key), uses port 4321 or `PREVIEW_PORT`, and leaves `dist` built without the dummy key.
- **Deploy** happens only through the manual `workflow_dispatch` of `website-pages.yml`. Fonts: same bundled `@fontsource` packages, no CDN. Screenshots come from the capture harness (`website/public/images/README.md`).

## Known gaps

Never exercised by a person (tests and capture runs cover the logic and the first paint, not these):

- Tray icon and menu, tray status text from the Timer, native notifications and their click-through, close-to-tray.
- Real file dialogs (open, save, export, import), drag-and-drop from a file manager, quitting with unsaved Editor changes.
- Deep links and the `.md` file association on an installed `.deb` (the association ships commented out in `electron-builder.yml`).
- The installed `.deb`, and the Windows and macOS builds at all (targets are configured only).
- Clipboard on Wayland, fullscreen in the Player, theme following a live OS light/dark change, keyboard focus order.
- Real form delivery on the website (needs a live Web3Forms key).

Checked once, by machine: `pnpm dist` built `release/electron-app-template_0.1.0_amd64.deb`, and the unpacked build started and rendered the sheet index from the private scheme. The `.deb` itself was not installed.

Not hardened: the packaged app still accepts Chromium switches such as `--remote-debugging-port` (Electron's default). Turn them off with Electron fuses (`@electron/fuses`) before shipping a real app.

Not built (outlines in `docs/guides/not-built.md`): auto-update, multiple windows, translations, SQLite, code signing.

Placeholders to set: `brand.links.website` is `https://example.com/`, the repository URL is a guess, icons are generated placeholders.

## Commits

Small, descriptive checkpoints: imperative subject line, optionally prefixed with the area (`Main:`, `Store:`, `Shell:`, `Notes:`, `Site:`, `Docs:`), body listing what changed and why. One workstream per commit, and each commit should pass `pnpm typecheck && pnpm test` on its own.
