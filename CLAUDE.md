# Project Ops

A desktop organizer for the owner's coding projects (Electron 45, React 19, TypeScript strict, Vite 8, esbuild for the main process, vitest, pnpm 11). The owner lists one or more **scan folders** (parents such as `~/code_projects`); Project Ops walks them, finds each project folder, reads its name, stack and git state, and shows every project as a card in a grid. A filter rail (category, tags with include and exclude, status, stack), search and sort narrow the grid. A card opens the folder in the file manager, the folder in a code editor, a terminal there, copies the path, opens the project's links and pins it. Category, tags, status, name, description and links are the owner's own and survive rescans. The app was reworked from an Electron starter template; the template's eight demo apps are gone and one app, `projects`, is the home screen. Settings, the command palette, the native menu, the tray, export/import and the typed IPC remain. `website/` is a separate Astro product-site template that was not touched by the rework and still describes "App Template" (see [Website](#website)).

Terms: the **main process** is the Node side (`electron/`), which can touch files, the network and the OS. The **renderer** is the web page (`renderer/`), sandboxed and treated as untrusted. The **preload** script (`electron/preload.ts`) is the only bridge and exposes `window.app`. **IPC** is the message passing across that bridge. A **record** is one stored project (with a real path); a **view** is what the page gets instead: no path. A **scan root** is a folder the scan walks. A **tombstone** is a project record kept with `hidden: true` so a scan does not bring it back.

Design: `docs/superpowers/specs/2026-11-18-project-ops-design.md` (its last section "As built" lists where the build differs; the code wins). `docs/superpowers/specs/2026-11-17-app-template-design.md` and `docs/superpowers/plans/` are the template's history, not current. Task guides: `docs/guides/`, start with `docs/guides/projects.md`.

## Commands

```bash
pnpm dev            # vite (port 5173, strict; APP_DEV_PORT=5199 pnpm dev for another) + esbuild watch + Electron
pnpm typecheck      # renderer/shared/tests tsconfig, then the electron tsconfig
pnpm test           # vitest (pure logic only; no Electron, no DOM)
pnpm build          # typecheck + renderer bundle (dist-renderer) + main bundle (dist-electron)
pnpm dist           # build + .deb in release/ (Linux x64)
pnpm dist:win       # build + NSIS installer (configured, never run)
pnpm dist:mac       # build + dmg (configured, never run)
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
                          register files: app data settings projects; index.ts
  store/                  jsonStore.ts (atomic JSON files in userData), collection.ts + collectionCore.ts (openCollection, CRUD),
                          projects.ts (projectsStore, rootsStore), settings.ts, windowState.ts + windowStateShape.ts,
                          bundle.ts + dataTransfer.ts (export/import/reset)
  features/               projects.ts (what the IPC handlers call), projectsCore.ts (pure), projectsScanRun.ts (one scan),
                          projectScan.ts + projectScanCore.ts (folder walk; markers, stack, merge),
                          gitInfo.ts + gitInfoCore.ts (git facts, plain-config rule), launch.ts + launchCore.ts (editor/terminal/folder),
                          which.ts (PATH lookup), smallFile.ts (bounded reads), fsUtil.ts (isDirectory), files.ts + filesCore.ts (folder/open/save dialogs, displayPath),
                          appProtocol.ts + appServe.ts (serve the built page), deepLink.ts + deepLinkParse.ts, links.ts, tray.ts,
                          logger.ts, assets.ts, home.ts
shared/                   code both sides import; never imports electron or React
  brand.ts                name, ids, links, default theme: the one rebrand file
  projects/               record.ts (stored record, limits, healProject, projectSpec), patch.ts (healProjectPatch),
                          view.ts (ProjectView, toProjectView), roots.ts (RootFields, rootSpec), index.ts
  launchers.ts            the fixed table of editors and terminals
  ipc/                    define.ts, app.ts data.ts settings.ts projects.ts, index.ts (IPC map + types), bridge.ts (window.app type)
  collections/            base.ts (RecordBase, CollectionSpec), heal.ts (line, strList, ...); no collection list
  commands.ts settings.ts theme.ts csp.ts superseded.ts
renderer/
  main.tsx index.html App.tsx   entry: font, theme CSS, initial theme, <AppShell/>
  shell/                  AppShell, TitleBar, TitleBlock, CommandPalette, ShortcutHelp, ErrorBoundary, ShellContext (hooks apps use),
                          router.ts, handlerRegistry.ts, commandTable.ts, paletteFilter.ts, useShellNav/useShellCommands/useShellEvents/
                          useConfirm/useSettingsEscape, shellModel.ts (pure), ipcSafe.ts
  apps/                   registry.ts (APPS = [projects]), types.ts (AppDefinition), projects/ (the screen, see below)
  settings/               SettingsScreen + ProjectsSection, AppearanceSection, DataSection, AboutSection; projectsSettingsModel.ts, themeTokens.ts (pure)
  theme/                  tokens.css, themes/kojima.css, index.css, useTheme.ts, color.ts (contrast maths)
  components/common/      Badge Button Card Combobox Dialog Dropdown EmptyState Field Icon IconButton Kbd KeyValue List Panel Segmented
                          Slider Spinner SplitPane StatusDot SuggestionList Switch TagInput (+ tagInputModel.ts) TextArea TextField Toast Toolbar
  hooks/                  pushStore.ts, useProjects.ts, useProjectRoots.ts (useRoots, useScanState, useLaunchers), useSettings,
                          useAttempt (run an action, toast its error), useAppEvent useShortcuts useDismiss useLatest
  utils/                  changelog.ts and credits.ts (parse the bundled CHANGELOG.md and THIRD_PARTY_NOTICES.md), format, step, platform, errorMessage, plural, projectText (scan and count wording), cx (class joiner)
  styles/                 base, controls, fields, overlays, layout, cards, badges, slider (all token-based)
tests/                    vitest; tests/apps/ (projects screen models), tests/projects/ (shared), tests/main/ and tests/store/ (main-side pure code)
scripts/                  dev.mjs, build-electron.mjs, make-icons.mjs
build/                    icon.png, icons/<N>x<N>.png, tray.png (placeholders)
docs/guides/              task guides; docs/superpowers/: specs and the template's plan
CHANGELOG.md THIRD_PARTY_NOTICES.md   both bundled into the app and parsed for Settings > About (formats: "CHANGELOG format" below)
AGENTS.md TODO.md README.md
website/                  Astro 7 site template, own package.json and lockfile (config in src/config/)
.github/workflows/        ci.yml (typecheck + test), website-pages.yml (manual Pages deploy)
```

`renderer/apps/projects/`: `ProjectsApp.tsx` (state and wiring), `FilterRail.tsx`, `ProjectsToolbar.tsx`, `ProjectCard.tsx`, `ProjectDialog.tsx`, `useProjectFilters.ts`, `projects.css`, and the pure models `projectsModel.ts` (query, filters, sort, facets), `filterState.ts` (tag cycle, rail tags, reveal, stored view state), `cardModel.ts` (status light, stack labels, toast text), `projectDraft.ts` (edit form and the patch it sends).

## How it fits together

- **Page origin and CSP.** The packaged page is never loaded from `file://`. `electron/features/appProtocol.ts` registers a privileged scheme `project-ops-app://renderer/` (`brand.scheme` + `-app`, `shared/csp.ts`) and `appServe.ts` answers it from `dist-renderer`, confined to that folder (realpath check, GET and HEAD only, `nosniff`). The one Content-Security-Policy is built by `buildCsp()` and sent as a response header on HTML: everything from `'self'`, `connect-src 'none'` (no network from the page), `media-src 'none'` (there is no media), `img-src 'self' data:`, fonts from `'self'` only (never `data:`). In dev (`VITE_DEV_SERVER_URL` set by `scripts/dev.mjs`) the page comes from Vite and `applyDevCsp` adds the dev variant (HMR websocket, inline script). The privileged scheme is registered once, before app ready (`main.ts`).
- **Window.** `window.ts`: `contextIsolation`, `sandbox`, no `nodeIntegration`; shown on `ready-to-show` with the theme's background colour; size and position saved in `window-state.json` and fitted to the connected displays; `APP_WINDOW_BOUNDS=1280x800` (or `x,y,w,h`) overrides them, ignored when packaged. `lockDownSession` grants only `fullscreen`; `lockDownContents` blocks navigation, new windows and webviews. A single-instance lock sends a second launch's arguments to the first window.
- **Close guard.** An app calls `useNavigationGuard(message)` while it has unsaved work (`window:set-guard`); a close or quit then emits `window:close-requested` and the shell asks with `ConfirmDialog`. The projects screen never sets it (edits are saved by the dialog). A crashed or hung page drops the guard. With `closeToTray` on (default off) and a tray that exists, closing hides the window. The tray has "Show" and "Quit" only.
- **IPC.** Every channel is declared once in `shared/ipc/<part>.ts` as `"part:verb": invoke<[args], Result>()`, `drop<Result>()` or `event<Payload>()`, merged in `shared/ipc/index.ts`. Parts: `app` (also `menu:`, `window:`, `log:`, `links:`), `data`, `settings`, `projects`. The preload refuses any channel not in `IPC`. In main, `electron/ipc/<part>.ts` has `register()` calling `handle(channel, validator, fn)`. `handle` accepts only the main window's top frame, validates every argument with `v.*`, logs, and rethrows as `Error(message)`. `emit` pushes to the page (`useAppEvent`). No `drop` channel is declared now; the mechanism remains.
- **Collections.** `electron/store/collection.ts` `openCollection(spec)` returns a store over `userData/<name>.json` (list, get, create, update, remove, restore, reorder, replaceAll, clear, onChange); ids are 16 hex, timestamps are set there, every write goes through the spec's `heal()`. There is no list of collections and no page-facing generic channel: the two collections are main-only (below).
- **Projects and roots.** `projects.json` (`projectSpec`, `shared/projects/record.ts`, max 2000 records) and `project-roots.json` (`rootSpec`, max 20) are opened only by `electron/store/projects.ts`. The page never receives a record. `projects:list` returns `ProjectView[]` (hidden records left out): `folder` is display text from `displayPath` (`~/…/a/b`), `links` are effective links, and `overrides` (the owner's stored name, description, links) plus `detected` (scan name, description, remote) feed the edit form. `projects:roots-list` returns `RootView` (`id`, `folder`, `projectCount`). Pushes: `projects:changed` (after every projects write), `projects:roots-changed` (only when the root views changed), `projects:scan-state`. Every handler addresses a record by id (`v.recordId`) and looks the path up itself. `projects:update` takes a patch healed by `healProjectPatch`: only `name`, `description` (null or "" = use detected), `category`, `tags`, `status`, `pinned`, `links` (merged key by key; null or "" clears one; https only). `path`, `origin`, `rootId`, `missing`, `hidden`, `scan` and unknown keys in a patch are ignored.
- **Scan.** `projectScan.ts` walks each root breadth-first to depth 4 (`MAX_DEPTH`), never into dot-folders, symlinked folders or `SKIP_DIRS` (`node_modules vendor dist build out target venv .venv __pycache__`). A folder whose entries include a marker (`PROJECT_MARKERS` in `projectScanCore.ts`, or a `.sln`/`.csproj`) is a project and the descent stops there; the root itself is never a project. The name is always the folder name; `package.json` supplies the description and stack only (cloned template sites share one package name); `STACK_RULES` gives stack ids from file names and `package.json` dependencies. The category of a new project is the first folder level under the root when it is nested deeper than one level, else "". `mergeScan` (pure) merges by exact real path: a match keeps id, timestamps and every user field and gets `scan` refreshed and `missing` false; a new path becomes `origin: "scan"`; a scan record of a scanned root that was not found gets `missing: true`; a manual record found by a scan stays manual; a hidden record stays hidden; a found scan record whose root is gone (null or no longer a root) is adopted by the root that found it, so overlapping or nested roots do not duplicate it. The rescan result does not count hidden projects as missing. `scan()` (`projectsScanRun.ts`) is one scan at a time by a counter: a newer scan, a root removal, import, reset or shutdown supersedes it (it throws `supersededError()`, which callers ignore). It collects everything, reads git for found paths (four at a time) and re-checks folders of records the scan does not settle (manual ones, ones whose root was removed), then merges and calls `replaceAll` once with no `await` in between, so an edit made during the scan is not overwritten. No scan runs at startup; one runs when a root is added and on Rescan. `projects:add-folder` adds one folder as `origin: "manual"` (an already known folder is un-hidden instead). `projects:refresh` re-reads one folder. `projects:remove` sets `hidden` (a tombstone); `restore` clears it; the page offers remove only in the edit dialog, with an Undo toast, and there is no view of hidden projects. Removing a root keeps its projects and its hidden tombstones (`rootId` becomes null, still `origin: "scan"`), so a removed project does not return through another root and root counts stay right. Network (UNC, `\\server\share`) paths are refused in project and root records (`isNetworkPath`, `shared/projects/record.ts`) and at the folder dialog, because checking one on Windows opens a network connection.
- **Git info.** `gitInfo.ts` runs git only in a folder whose `.git` is a real directory with a **plain config**: `.git/config` (read with `readSmallFile`, 64 KB cap) parses strictly and every key is on the allowlist in `gitInfoCore.ts` (`ALLOWED`: core basics including `core.hookspath` (every call overrides it with `-c core.hooksPath=/dev/null` anyway), `branch.<name>.github-pr-base-branch` (plain data written by the gh CLI), remotes, branches, user name/email, pull/push defaults, init.defaultbranch, submodule urls, lfs), `core.repositoryformatversion` is 0, no URL contains a `::` transport helper, and there is no `.git/config.worktree`, `.git/commondir`, `.git/modules` or `.gitmodules`. Anything else (including keys future git adds) is not plain: no git process runs, `branch` and `repoUrl` come from `.git/HEAD` and `.git/config`, and `lastCommitAt` and `dirty` stay null. A `.git` file (worktree or submodule pointer) gives no info at all. Git is also pinned to the validated folder: every call passes `--git-dir=<path>/.git --work-tree=<path>`, `GIT_CEILING_DIRECTORIES` is the parent folder, `safe.bareRepository=explicit`, git runs only when `.git/HEAD` is a regular file and `objects/` and `refs/` are folders, and inherited `GIT_*` variables are stripped from the environment. Where git runs: an absolute `git` found by `which`, `shell: false`, fixed arguments plus `-c` options that switch off fsmonitor, hooks, attributes and submodule recursion, `GIT_CONFIG_NOSYSTEM=1`, 5 s timeout, 1 MB output cap, children killed in `shutdownProjects`. Remote URLs go through `remoteToHttps` (scp, ssh, git and https forms; credentials and `.git` stripped; anything else null).
- **Launchers.** `shared/launchers.ts` is a fixed table (`EDITORS`, `TERMINALS`): the page and the settings hold only an id, and each entry builds `{command, args}` per platform with the folder as its own argv element. `launch.ts` resolves the command with `which` to an absolute file from absolute `PATH` entries only (never a bare name, because the working directory is the project folder; CWE-427), refuses a program inside the project folder, spawns with `shell: false`, `detached`, `stdio: "ignore"`, `cwd` the project and an environment cleaned by `childEnv` (no `ELECTRON_*`, `VITE_*`, `APP_*`, `NODE_OPTIONS`). `projects:open` with `editor` or `terminal` uses the setting, else the first detected program (`resolveLauncher`); `folder` uses `shell.openPath`, and on macOS a bundle folder (`.app` and friends) is revealed in its parent instead (`isBundleName`). `projects:launchers` lists ids found on PATH (cached 30 s). Linux entries are the ones in use; macOS and Windows entries are untested, and Windows `.cmd` entries (`code.cmd`) will probably fail to spawn with the shell off (comment in `launch.ts`).
- **Settings and the theme.** `shared/settings.ts`: `theme`, `mode`, `accent`, `closeToTray`, `editor`, `terminal`. `store/settings.ts` in main, `useSetting(key)` in the page, `settings:changed` push. There is one theme, Kojima (`THEMES` in `shared/theme.ts`, `renderer/theme/themes/kojima.css`): 12 base tokens for light and dark, safety orange accent, dark by default, DM Sans (`@fontsource/dm-sans`) for text and headings. The mono "label" look (buttons, badges, field labels, kickers, key caps) is one rule in `renderer/styles/base.css` driven by `--label-*` tokens; upper case comes from CSS, copy stays sentence case. `useTheme` sets `data-theme` and `data-mode` on `<html>`; mode `system` follows the OS. The accent override recomputes `--accent-ink` and `--accent-text`. Settings > Appearance has mode and accent only (no theme picker with one theme). Main passes the first theme to the preload as `--app-theme=<theme>:<mode>`. A second theme is still one CSS file (`docs/guides/add-a-theme.md`).
- **Commands.** One table: `SHELL_COMMANDS` and `goCommands()` in `shared/commands.ts`, plus each app's `commands`. A command has `keys` (plain keys the page handles) and/or an `accelerator` (native menu, sends `menu:command`). The same table drives `useShortcuts`, the native menu, tooltips (`hint()`), the palette and the `?` help. Projects commands: `projects.search` (`/`), `projects.add-folder` (Ctrl/Cmd+O), `projects.rescan` (F5), `projects.clear-filters` (palette only, active only while a filter is set). `goCommands` returns nothing for one app; `shell.home` ("Go to projects", Ctrl/Cmd+Shift+H) goes to the first app.
- **Shell and registry.** `renderer/apps/registry.ts` (`APPS`) is the only list of apps; the first is the home screen. There is no home view and no rail. `router.ts` is a reducer over `settings | app(appId, recordId)`; "home", an unknown app id and `project-ops://home` open the first app. The wordmark in the title bar goes home; the settings button toggles; Escape leaves Settings when no dialog is open (`useSettingsEscape`). Apps reach the shell through `ShellContext` hooks: `useShell` (navigate, toast, confirm, route), `useTitleInfo` (count in the title block), `useCommandHandlers`, `useNavigationGuard`, `useHint`.
- **Deep links.** `project-ops://home`, `://settings`, `://open/<appId>[/<recordId>]` (`deepLinkParse.ts`, strict). `project-ops://open/projects/<id>` clears the filters that hide that project, scrolls to its card and marks it (`revealFilters`). Links that arrive before the page says `app:ready` wait in a queue. `app.setAsDefaultProtocolClient` runs only when packaged.
- **The projects screen.** `useProjects()` (`renderer/hooks/useProjects.ts`) is a `pushStore` (`pushStore.ts`): load once with `projects:list`, then the list changes only when `projects:changed` arrives; a push beats an in-flight load and a stale reload never overwrites a newer one. `useRoots`, `useScanState` and `useLaunchers` follow the same pattern. Filters (`projectsModel.ts`): search words must all match name, description, category, tags, stack, branch or folder; one category (or the uncategorised bucket); tags have include (project must have all) and exclude (must have none) lists, cycled off, include, exclude by clicking a rail tag; statuses (default active and paused, archived off); stack (any of); sort pinned first, then last commit, name, date added or last edited. Facet counts leave out the group being counted, except tags: a tag's count is what clicking it would give (an excluded tag shows how many projects it hides). Filters and sort are kept in `localStorage` under `projects.view.v1` (try/catch, healed on read; this is the one use of `localStorage`). A card shows the category strip, status light (a missing folder outranks status), name, description, tags, trait rows (branch with a dirty marker, last commit, stack, folder, links) and buttons; missing folders mute the card and disable the open buttons. The edit dialog sends only changed fields (`projectDraft.ts`). An open suggestion list (Tags, Category) is its own dismiss layer: the first Escape closes the list, the next the dialog.
- **Network.** None. The page's CSP forbids it and main makes no requests; only `openExternalHttps` and `links:open` hand https URLs to the OS browser.

## Rules

- **One source of truth.** Brand in `shared/brand.ts` (`tests/brand.test.ts` checks `package.json` and `electron-builder.yml` against it). Channels in `shared/ipc/`. Commands in `shared/commands.ts` and the apps' `commands`; never hard-code a shortcut hint, use `hint()`. Colours, type, spacing, radii and layers in `renderer/theme/tokens.css` and the theme file. The project record and its limits in `shared/projects/record.ts`. Editors and terminals in `shared/launchers.ts`.
- **Tokens only.** No raw hex or rgba outside `renderer/theme/`; use the semantic tokens (`--bg --surface --text --line --accent ...`). DM Sans is bundled from `@fontsource`, never from a CDN and never inlined as `data:` (`vite.config.ts` stops Vite inlining font files).
- **Common components first.** Reuse `renderer/components/common/*` and the existing hooks before writing a new one. Extract a shared piece at the third use. Apps never build their own confirm dialog (`useShell().confirm`).
- **File size.** Keep files under about 300 lines; split by responsibility.
- **Pure logic in tested modules.** Anything with branching goes in a pure module (`*Model.ts`, `*Core.ts`, `*State.ts`, `*Draft.ts`) with a test in `tests/`; hooks and components stay thin. Main files that import `electron` keep their pure part in a sibling so vitest can load it.
- **Layering.** `shared/` imports neither `electron` nor React. `electron/` never imports from `renderer/`.
- **New IPC** goes `shared/ipc/` then `electron/ipc/` (handler plus validators). Never add a channel that takes a path, a URL or a command from the page; take a record id, a key or a table id and look the value up in main.
- **Styling.** Sentence-case copy; 2 px radii; motion only in answer to an action and not under `prefers-reduced-motion`; visible keyboard focus. App CSS classes start with the app id (`projects-`).

## Security model

The renderer is sandboxed with context isolation and is treated as untrusted. Main validates everything it receives. A project folder is also untrusted: it can hold a symlink to a device, a hostile `.git/config` or a program named like an editor.

- **Sender:** only the main window's top frame can call a handler.
- **Arguments:** every `handle` has a validator (`v.string`, `v.int`, `v.oneOf`, `v.recordId`, `v.raw` for the patch only, ...); anything unexpected is refused with `Invalid argument #n: expected ...`.
- **Paths never reach the page.** Records and roots are main-only; views carry display text. Folders come only from directory dialogs in main (or the dev stand-in) and are `realpath`ed and checked to be folders. Channels take a record id and look the path up. `projects:copy-path` makes main write the clipboard.
- **Patch heal.** The page's only write is `projects:update`; `healProjectPatch` keeps user fields only, key by key, and drops an invalid value rather than defaulting it.
- **Links:** https only, no credentials (`healLink`), at most 2048 characters, on store and again at open (`openExternalHttps`). `projects:open-link` takes a key (`repo`, `site`, `docs`), never a URL; `links:open` takes a key of `brand.links`.
- **Launchers:** ids from `shared/launchers.ts`, resolved to an absolute file on absolute `PATH` entries, refused when inside the project folder, `shell: false`, the folder one argv element, cleaned environment.
- **Git:** runs only in a plain-config repository, pinned to the validated folder (see above); never follows a `.git` pointer file; its own environment and config are neutralised.
- **Bounded reads:** `smallFile.ts` reads `package.json`, `.git/HEAD` and `.git/config` as regular files only (lstat, no symlinks, `O_NOFOLLOW | O_NONBLOCK`, hard byte cap). The scan reads directories with `isDirectory()` false for symlinks.
- **Import treats paths as data:** nothing from an import file is opened or checked at import; records are healed, and a folder that does not exist here shows as missing after the next scan. A file from a newer version refuses the whole import before anything is replaced; if a later write (or the settings update) fails after some collections were replaced, `applyCollections` puts those back from the lists it read and rethrows.
- **macOS bundles:** `openFolder` reveals a `.app`-style folder in its parent instead of launching it.
- **Menu:** the page's menu context is cut down by `sanitizeMenuContext`. **Session:** no permission but `fullscreen`; no navigation, popups or webviews. **Logging:** `log:write` is capped (2000 characters, 20 per minute), line breaks stripped.

## Concurrency rules

- Replaced requests are "superseded", not queued: a stale request throws `supersededError()` (`shared/superseded.ts`); callers treat `isSuperseded(e)` as "ignore silently". The scan does this with a counter (`latest` in `projectsScanRun.ts`). After any `await` in main, re-check the counter before touching the store; the merge and `replaceAll` follow the last `await` directly.
- In the page only the latest request may set state (`pushStore` counters, `alive` flags in effect cleanups).
- Kill what you supersede, from the real shutdown path in `main.ts` (`will-quit`, SIGINT/SIGTERM), not from `before-quit`, which the close guard can cancel: `shutdownProjects` drops the scan and kills git children. Import and reset call `invalidateScan()` first; removing a root does too.
- A dialog or `await` in a main handler can outlive the window: check `getWindow()` afterwards (`addFolder`, `addRoot`, `exportData`, `importData`). `refresh` re-reads the record after its awaits and skips the write if it was replaced.

## Stored data

JSON files in Electron's `userData` folder (Settings > Data > Show data folder opens it). File names match `^[a-z0-9-]+\.json$`. Writes are atomic (temp file then rename); a failed write is reported, not swallowed.

| File | Shape | Written by |
| --- | --- | --- |
| `settings.json` | `{version, values}` | `store/settings.ts` |
| `window-state.json` | `{bounds, maximized}` | `store/windowState.ts` |
| `projects.json` | `{version, items}`, items are records with real paths | `store/projects.ts` via the collection store |
| `project-roots.json` | `{version, items}`, items `{id, createdAt, updatedAt, path}` | same |
| `logs/main.log` | text; at 1 MB it moves to `main.old.log` | `features/logger.ts` |

- Every read goes through a `heal()` that takes `unknown`, so a hand-edited or stale file never crashes the app. A file that is not valid JSON or not the envelope is "damaged": moved aside to `<name>.json.unreadable-<timestamp>` before the first write, and the app carries on empty. A file whose `version` is higher than the code's is "newer": reads give an error or defaults and the file is never touched. Bump `version` only with a migration in `heal()`.
- **Export/import** (`store/bundle.ts`): `{format: "project-ops", version: 1, exportedAt, settings, collections: {projects, "project-roots"}}`. Export writes full records (hidden ones and absolute paths included). Import replaces only the settings keys and collections the file contains, healed. Reset empties both collections and deletes settings; window state and logs are kept.

## Verifying without a person

`electron/devCapture.ts` (off when packaged) screenshots the window and quits. Variables use `brand.envPrefix` (`APP`):

| Variable | Meaning |
| --- | --- |
| `APP_CAPTURE=<png>` | turn capture on; write the screenshot there |
| `APP_CAPTURE_DELAY=3000` | ms before the screenshot (at least enough for the keys) |
| `APP_CAPTURE_SIZE=1280x800` | content size (check the PNG; the compositor may not honour it) |
| `APP_CAPTURE_KEYS=/,Down` | keys to press, comma separated, one second after load, 400 ms apart |
| `APP_CAPTURE_EVAL=<js>` | expression run in the page before the screenshot; logged as `[eval] ...` |
| `APP_WINDOW_BOUNDS`, `APP_LOG_LEVEL` (`warn`, `error`) | window size override; log threshold |
| `APP_PICK_FOLDER=/abs/dir` | dev stand-in for the folder dialog (Add folder, Add scan folder); same realpath and directory checks |
| `APP_LAUNCH_DRY=1` | open-in-editor/terminal/folder logs what it would run instead of running it |

```bash
pnpm exec vite build --configLoader runner && pnpm build:electron     # no dev server, so port 5173 is not needed
S=$(mktemp -d)                                                        # throwaway profile
mkdir -p $S/demo && echo '{"name":"demo"}' > $S/demo/package.json     # a real folder for the seeded record
echo '{"version":1,"items":[{"id":"0123456789abcdef","createdAt":1,"updatedAt":1,"path":"'$S'/demo","origin":"manual","rootId":null,"missing":false,"hidden":false,"name":null,"description":null,"category":"Seeded","tags":["demo"],"status":"active","pinned":false,"links":{"repo":null,"site":null,"docs":null},"scan":{"name":"demo","description":null,"repoUrl":null,"branch":null,"lastCommitAt":null,"dirty":null,"stack":["node"],"scannedAt":1}}]}' > $S/projects.json
APP_CAPTURE=$S/out.png APP_CAPTURE_SIZE=1280x800 APP_CAPTURE_DELAY=4000 \
APP_CAPTURE_EVAL='document.querySelectorAll(".projects-card").length' \
  pnpm exec electron --no-sandbox --user-data-dir=$S . project-ops://open/projects/0123456789abcdef
```

- Always pass `--user-data-dir`: it keeps your real data out of the capture, and the single-instance lock is per profile. Seed `projects.json`, `project-roots.json` or `settings.json` there before launching (shapes above and `shared/projects/record.ts`; ids are 16 hex characters). Seeded records need a real folder for `path`, or they show as missing.
- To drive a scan: seed `project-roots.json` (`{"version":1,"items":[{"id":"...","createdAt":1,"updatedAt":1,"path":"/abs/root"}]}`) and call `window.app.invoke("projects:scan")` from `APP_CAPTURE_EVAL`, or set `APP_PICK_FOLDER` and invoke `projects:roots-add`.
- `pnpm dev` needs its port free (`strictPort`; `APP_DEV_PORT` picks another); building first and running `electron .` avoids the dev server. `--no-sandbox` is needed in dev on Linux because the npm-installed `chrome-sandbox` is not setuid root; `pnpm dev` adds it when needed. The packaged `.deb` is meant to run sandboxed.
- Keys are sent as Electron key codes: single characters (`/`, `?`, `shift+/`) work; check others. Shortcuts are ignored while a text field has focus. Light/dark: seed `settings.json` with `{"version":1,"values":{"mode":"light"}}` (the only theme is Kojima).
- The capture ends with `app.exit(0)`, which skips quit guards.

## CHANGELOG format

`CHANGELOG.md` is parsed by `renderer/utils/changelog.ts` for Settings > About: each `## <version> - <date>` heading (a version must contain a digit) starts an entry and its `-` or `*` bullets are the items, newest first. Text before the first heading and a heading without a version are ignored. `THIRD_PARTY_NOTICES.md`: one `## <name>` heading per notice; the headings are listed in About. `tests/changelog.test.ts` parses the real files.

## Changing the project record

Full steps: `docs/guides/projects.md`. A new stored field touches, in order: `ProjectFields` and `healProject` in `shared/projects/record.ts` (limit in `PROJECT_LIMITS`; no `version` bump when an old file can heal to a default); `ProjectPatch` and `healProjectPatch` in `patch.ts` if the owner edits it; `ProjectView` and `toProjectView` in `view.ts`; `newManualProject` and the new-record literal in `mergeScan` (they build records by hand); then the card, edit dialog and `projectDraft.ts`, the filter model if it filters, and the tests in `tests/projects/heal.test.ts` and `tests/apps/`. The registry can still take more apps (`docs/guides/add-an-app.md`; with two or more apps `goCommands` and the Go menu reappear).

## Website

`website/` is a rebrandable Astro site. It was not changed by the rework: `website/src/config/product.ts` still says "App Template", repository `areimel/electron-app-template`, and describes the eight demos. `website/README.md` is its guide; `website/AGENTS.md` is Astro boilerplate.

- **Separate project.** Own pnpm workspace and lockfile: `pnpm --dir website ...`; never add site dependencies to the root or app dependencies to the site.
- **Config, not pages.** Product facts, deploy defaults, copy and form text live in `website/src/config/`. The installer script served at `<base>/install.sh` is generated from that config (`src/pages/install.sh.ts`).
- **Base path.** Served under `SITE_BASE` (default `/electron-app-template`, `deploy.ts`); every link and asset goes through `url()` in `src/config/site.ts`.
- **Forms.** Web3Forms with `PUBLIC_WEB3FORMS_ACCESS_KEY` (public by design), env only (`website/.env`, gitignored). No key means the forms render as unavailable, and that path is tested.
- **Tests.** `test:browser` builds twice (dummy key with mocked submissions, then no key), port 4321 or `PREVIEW_PORT`.
- **Deploy** only through the manual `workflow_dispatch` of `website-pages.yml`.

## Known gaps

Never exercised by a person (tests and capture runs cover logic and first paint, not these):

- The real folder dialog (Add folder, Add scan folder); real editor, terminal and file-manager launches (capture runs use `APP_LAUNCH_DRY` and `APP_PICK_FOLDER`).
- Tray icon and menu, close-to-tray, real file dialogs for export and import, clipboard on Wayland, fullscreen, theme following a live OS change, keyboard focus order.
- Hover and glitch motion, and performance with hundreds of cards (no virtualisation).
- The installed `.deb` (deep links there too) and the Windows and macOS builds at all. Windows `.cmd` launcher entries probably fail; macOS `open -a` entries and the bundle rule are untested.
- Real form delivery on the website.

Product limits: a moved or renamed folder shows as missing and a new card appears at the new place without the old edits; exports contain absolute paths; there is no view of hidden projects (an Undo toast, or adding the same folder again with "Add folder", brings one back; a scan does not); a repository with a non-plain config shows branch and remote but no last-commit time or uncommitted-changes marker; a `.git` pointer file shows none of the three; git facts are as fresh as the last scan or refresh; editor detection is by command name on `PATH`, so a Flatpak or Snap editor not on `PATH` shows as not found; scan descends at most 4 levels and at most 20 roots are allowed.

Not hardened: the packaged app still accepts Chromium switches such as `--remote-debugging-port` (Electron's default). Turn them off with Electron fuses (`@electron/fuses`) before shipping.

Not built (outlines in `docs/guides/not-built.md`): auto-update, multiple windows, translations, SQLite, code signing.

Placeholders: `brand.links.website` is `https://example.com/`, the repository URL is a guess, icons are generated placeholders. `THIRD_PARTY_NOTICES.md` still lists `markdown-it` and `babu-video-player` from the removed demos.

## Commits

Small, descriptive checkpoints: imperative subject line, prefixed with the area (the branch used `Template:`, `Docs:`, `Brand:`, `Shared:`, `Hooks:`, `Main:`, `Store:`, `Shell:`, `Theme:`, `Components:`, `Settings:`, `Projects:`, `Site:`), body listing what changed and why. One workstream per commit, and each commit should pass `pnpm typecheck && pnpm test` on its own.
