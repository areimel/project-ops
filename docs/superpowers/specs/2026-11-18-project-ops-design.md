# Project Ops: design

Date: 2026-11-18. Status: approved by Alec (plan review). Source of truth for decisions: the approved plan `~/.claude/plans/new-project-start-project-ops-floating-meadow.md`; this spec restates it for a builder who was not in the planning conversation and fills the gaps the plan left open. Items marked **(call)** were decided while writing this spec, not by Alec, and may be changed. Where this spec and the code disagree once built, the code wins and this file should be corrected.

## Intent

Alec has many coding projects spread over folders under `~/code_projects` (desktop apps, websites, terminal tools, client work). He wants one place to see them all, search them, filter them and sort them, and to jump from a project straight into its folder, his code editor, a terminal or its web links.

Each project has exactly one **category** (where it belongs, for example "Work projects" or "Personal") and any number of **tags** (what it is, for example a terminal app tagged "CLI" but not "TUI"). Projects are shown as **cards**: a block with the project's facts and a row of open buttons.

This repo is the Electron app template (see `CLAUDE.md`). Project Ops is built by reworking it: the eight demo apps go, the shared plumbing (typed IPC, the JSON stores, the command table, the palette, Settings, export and import, the capture harness) stays, and the single remaining app is the project organizer. The look is copied from Alec's Kojima Astro template (`areimel/kojima-astro-template`, `src/styles/kojima.css`), not from the template's Blueprint theme.

## Goals

- Find projects automatically by scanning chosen parent folders ("scan roots"), and add a single folder by hand.
- Show each project as a card with: name, description, category, tags, status (active, paused, archived), a pin, git info (branch, last commit date, uncommitted changes), the detected stack (Node, Rust, Python, ...) and the folder as display text.
- Card buttons: open in the file manager, open in the code editor, open in a terminal, copy the folder path, and web links (repo, site, docs) where set.
- Search, filter (one category, tags, status, stack) and sort (name, last commit, date added; pinned first), with counts per filter value.
- Let the user edit everything about a project; a rescan refreshes detected facts and never overwrites an edit.
- Keep the template's security model intact and its rules (one source of truth, pure tested logic, files under about 300 lines, tokens only).
- One theme, Kojima, dark by default with an ivory light mode, and the existing accent override.

## Non-goals

- **Tracking moved or renamed folders.** A moved folder shows as missing and the new location appears as a new card. Edits are not carried over.
- **Arbitrary commands.** No "run script", no custom launch command lines, no build buttons. Launchers come from a fixed table.
- **A category management screen.** Categories are free text on each project; the list in the filter rail is whatever values exist.
- **Multiple windows**, auto-update, translations, sync between machines.
- **The `website/` folder.** It stays exactly as it is; no rebrand, no new pages.

## Anti-goals

These would be defects, not missing features:

- **The page ever seeing or supplying an absolute path.** The renderer gets display text (`~/…/project-ops`) and opaque ids. It never sends a path, a URL or a command line to main.
- **A rescan overwriting user edits.** Detected values and user values live in separate fields; the view picks the user value when there is one.
- Loosening the CSP, the sender check or argument validation to make a feature easier.

## Constraints

Everything in the `CLAUDE.md` "Security model", "Rules" and "Concurrency rules" sections holds. In particular: every IPC argument goes through a `v.*` validator in main; handlers accept only the main window's top frame; `shared/` imports neither `electron` nor React; branching logic lives in pure `*Core.ts` / `*Model.ts` / `*Shape.ts` modules with tests in `tests/`; no raw hex outside `renderer/theme/`; fonts are bundled from `@fontsource`, never a CDN or `data:`; superseded requests throw `supersededError()` and callers ignore them silently; anything spawned is killed from the real shutdown path in `main.ts`.

## Approaches considered

**A. Projects as an ordinary collection.** Add `projects` to `COLLECTIONS` and let the page use the generic `data:list/create/update/...` channels, with the folder path as a record field. Least code, and the page could render everything itself. Rejected: the page could create or update a record with any path it likes and then ask main to open it in a terminal, so a compromised page could launch a terminal or editor in any folder and read paths it was never shown.

**B. Page-writable collection plus a main-only path map.** Keep the page-facing collection for user fields, and hold `id → path` in a separate main-only file. Fixes the forgery problem. Rejected: two stores that must stay in step through create, remove, restore, import and reset, with failure cases when one write succeeds and the other does not.

**C. One main-only collection with a path-free view (chosen).** Projects live in `projects.json`, built on the existing pure `createCollection` (`electron/store/collectionCore.ts`) with a spec that is not in any table the page can name. Only main creates records (from a scan or a folder dialog), so only main ever sets `path`. The page reads a view of each record in which the path is replaced by display text, and changes records through a narrow `projects:update` whose patch is healed to user fields only. One file, one write per change, and the page has nothing it could forge.

Scan roots follow the same pattern: a second main-only collection, `project-roots.json`. They are not settings, because settings patches come from the page.

## Data model

### Project record (`shared/projects.ts`, stored in `projects.json`)

`RecordBase` (`id` 16 hex, `createdAt`, `updatedAt`) plus:

| Field | Type | Set by | Meaning |
|---|---|---|---|
| `path` | string | main only | Real path (after `realpath`) of the project folder; the dedupe key |
| `origin` | `"scan" \| "manual"` | main only | Found by a scan or added with the folder dialog |
| `rootId` | string \| null | main only | The scan root that found it; null for manual |
| `missing` | boolean | main only | The folder was not there at the last scan or refresh |
| `hidden` | boolean | main (remove/restore) | Tombstone; see Remove below |
| `name` | string \| null | user | Override; null shows `scan.name` |
| `description` | string \| null | user | Override; null shows `scan.description` |
| `category` | string | user (prefilled) | One category; `""` means uncategorised |
| `tags` | string[] | user | Free text, deduped case-insensitively |
| `status` | `"active" \| "paused" \| "archived"` | user | Default `"active"` |
| `pinned` | boolean | user | Pinned cards sort first |
| `links` | `{repo, site, docs}`, each string \| null | user (repo prefilled) | https URLs only |
| `scan` | object, see below | main only | Detected facts, replaced on every scan or refresh |

`scan` is `{name, description, repoUrl, branch, lastCommitAt, dirty, stack, scannedAt}`: folder or manifest name; manifest description (`package.json` `description`, `Cargo.toml` / `pyproject.toml` description) or null; https remote URL or null; current branch or null (detached or not a repo); last commit time in ms or null; `dirty` true / false / null (null when git timed out or the folder is not a repo); `stack` a list of ids from a fixed table; `scannedAt` ms.

Limits **(call)**: name 120 characters, description 500, category 48, at most 20 tags of 32 characters each, links 2048 characters, `max` 2000 projects. Text is trimmed and inner whitespace collapsed; empty override strings heal to null.

The heal function accepts `unknown`, as every heal in the repo does. Damaged and newer files behave as for the other collections (moved aside, or read-only with an error). Version 1.

### Two heals for one record

- `healProject(raw)` heals a whole stored record (file reads, import). It trusts `path` only as a string; main re-checks the folder before any launch.
- `healProjectPatch(raw)` keeps only user fields with valid values (`name`, `description`, `category`, `tags`, `status`, `pinned`, `links`). A link that is not a valid `https:` URL is dropped from the patch, not stored. Any `path`, `origin`, `scan` or `hidden` key in a patch is ignored. This is what `projects:update` applies, through `collection.update(id, patch)`.

### The view the page sees

`toProjectView(record, home)` (pure, in `shared/projects.ts` or a sibling) returns:

`{id, name, description, category, tags, status, pinned, links, origin, missing, folder, branch, lastCommitAt, dirty, stack, createdAt, updatedAt, nameIsDetected, descriptionIsDetected}`

`name` is `record.name ?? scan.name`, `description` is `record.description ?? scan.description`. `folder` is the display path: the home folder replaced by `~`, and when longer than two segments the middle collapsed to `…` (`~/…/desktop-app-projects/project-ops`) **(call: keep the last two segments)**. The two `*IsDetected` flags let the edit dialog show the detected value as placeholder text and offer "Use detected" (set the override back to null). Hidden records are not in the list at all. There is no `path` key in the view, and a test asserts that no string in a listed view starts with `/` or a drive letter.

### Remove and undo

Remove is a tombstone: `projects:remove(id)` sets `hidden: true` and the page shows an undo toast; `projects:restore(id)` sets it back. Undo is by id, because the record never left the file (the generic collection's `restore(record, index)` takes a record from the page, which would let the page supply a path). A hidden scanned project stays hidden on every later rescan, so removing a project you do not care about is permanent unless undone. **(call)** A manually added folder that is removed and then added again with the dialog is unhidden rather than duplicated.

### Scan roots (`shared/projectRoots.ts`, stored in `project-roots.json`)

`RecordBase` plus `path` (real path, main only). The page sees `{id, folder, projectCount}`. Limit 20 roots. Removing a root **(call)** keeps the projects it found: their `rootId` becomes null and they are checked for `missing` by refresh, like manual ones. The user hides them if they want them gone.

### What goes from the template's storage

Notes, tasks and snippets go, so nothing is page-addressable any more. Deleted: the generic `data:list/create/update/remove/restore/reorder` channels, `v.collection`, `useCollection`, `COLLECTIONS` and the three specs. Kept: `collectionCore.ts`, `shared/collections/base.ts` and `heal.ts`. `electron/store/collection.ts` becomes `openCollection(spec)`, which wires a spec to `jsonStore` and returns the core `Collection`.

## IPC: part `projects`

Declared in `shared/ipc/projects.ts`, handled in `electron/ipc/projects.ts`. `Project` below means the path-free view.

| Channel | Kind | Arguments | Result | Notes |
|---|---|---|---|---|
| `projects:list` | invoke | none | `{projects: Project[], roots: Root[]}` | Hidden records left out |
| `projects:update` | invoke | `id`, `patch` | `Project` | `v.recordId`, patch through `healProjectPatch` |
| `projects:remove` | invoke | `id` | void | Sets `hidden` |
| `projects:restore` | invoke | `id` | `Project` | Clears `hidden` |
| `projects:add-folder` | invoke | none | `Project \| null` | Directory dialog in main; null on cancel; refreshes the new record |
| `projects:roots-list` | invoke | none | `Root[]` | |
| `projects:roots-add` | invoke | none | `Root \| null` | Directory dialog in main, then scans that root |
| `projects:roots-remove` | invoke | `id` | void | |
| `projects:scan` | invoke | none | `{found, added, missing}` counts | Scans every root; superseded by a newer scan |
| `projects:refresh` | invoke | `id` | `Project` | Re-reads one folder: markers, stack, git |
| `projects:open` | invoke | `id`, `"folder" \| "editor" \| "terminal"` | void | `v.oneOf` for the target |
| `projects:open-link` | invoke | `id`, `"repo" \| "site" \| "docs"` | void | URL looked up in the record; `openExternalHttps` |
| `projects:copy-path` | invoke | `id` | void | Main writes the real path to the clipboard |
| `projects:launchers` | invoke | none | `{editors, terminals}`: `{id, label, installed}[]` | For Settings and for disabling buttons |
| `projects:changed` | event | `{projects, roots}` | | Pushed after every write; the page's list changes only on this push |

No channel takes a path, URL or command. After any dialog or `await` in a handler, check `getWindow()` before replying (as `editor:save-as` did). `projects:open` on a missing folder throws `That folder is no longer there. Rescan or remove the project.`

Settings gain two keys in `shared/settings.ts`: `editor` and `terminal`, each a launcher id from the fixed table or null (null means the first installed entry, resolved in main) **(call)**. They go through `healSettingsPatch` like the other keys. `closeToTray` stays, because the tray stays. `notifications` is removed with the Timer, the only thing that sent one.

## Scan rules

`electron/features/projectScan.ts` (file system and orchestration) with pure `projectScanCore.ts` (decisions, tested over an in-memory tree).

- Walk each root to depth 4 below the root.
- Skip folders whose name starts with `.` and a fixed skip list: `node_modules`, `vendor`, `target`, `dist`, `build`, `out`, `.venv`/`venv`, `__pycache__`, `coverage` **(call: exact list)**. Do not follow symlinked folders.
- A folder containing a marker is a project and the descent stops there (a monorepo is one project). Markers: `.git`, `package.json`, `Cargo.toml`, `pyproject.toml`, `setup.py`, `go.mod`, `Gemfile`, `composer.json`, `pom.xml`, `build.gradle`, `CMakeLists.txt`, `deno.json`.
- Stack comes from markers and manifests: Node (`package.json`), TypeScript (`tsconfig.json`), Rust, Python, Go, Ruby, PHP, Java, C/C++, Deno, plus Electron, Astro, React, Next and Vite read from `package.json` dependencies **(call: this list; the ids live in one table in shared)**.
- A new project's `category` is prefilled from the first folder level under the root: scanning `~/code_projects` finds `~/code_projects/desktop-app-projects/project-ops` with category `desktop-app-projects`. A project directly under the root gets `""`.
- Pure `mergeScan(existing, found, scannedRootIds)` dedupes by real path, adds new records, updates `scan` and clears `missing` on found ones, sets `missing` on records of a scanned root that were not found, and never touches user fields or `hidden`. The result is written once (`replaceAll` or an equivalent single write), and one `projects:changed` follows.
- A newer scan supersedes an older one with the counter pattern from the old `features/news.ts`; after each `await` the scan re-checks the counter before writing.
- Scans run when a root is added and on the "Rescan" command. **(call)** No automatic scan at startup; at startup the stored list is shown as it is, and the toolbar shows when the last scan ran.

## Git info

`electron/features/gitInfo.ts` with pure `gitInfoCore.ts` (output parsers, URL cleaning).

- Status: `execFile("git", ["--no-optional-locks", "-c", "core.fsmonitor=false", "-C", path, "status", "--porcelain=v2", "--branch"])`. Branch from `# branch.head` (`(detached)` reads as null); `dirty` is true when any non-header line exists.
- Last commit: `git -C <path> log -1 --format=%ct` (seconds, times 1000). No commits gives null.
- Remote: `git -C <path> config --get remote.origin.url`, converted to https (`git@github.com:a/b.git` → `https://github.com/a/b`), credentials and `.git` stripped; anything that cannot be made https gives null. It prefills `links.repo` only when that link is null.
- Environment: `GIT_TERMINAL_PROMPT=0`, a timeout of 5 s per call **(call)**, at most four repos at a time. A timeout or failure gives null fields, never an error for the whole scan.
- Children are tracked and killed from `shutdown()` in `main.ts`.

## Launchers

`shared/launchers.ts` is the fixed table: `{id, label, platform, command, args(dir)}`. Editors: VS Code, Cursor, Zed, Sublime Text, VSCodium. Terminals: GNOME Terminal, Ghostty, Konsole, Kitty, Alacritty, WezTerm. macOS and Windows entries are present and untested. The folder target uses `shell.openPath`.

`electron/features/launch.ts` with pure `launchCore.ts`:

- `spawn(command, args, {shell: false, detached: true, stdio: "ignore", cwd: dir})`, then `unref()`. The folder is passed as an argument, never inside a shell string.
- The child env is cleaned: Electron and Vite variables (`ELECTRON_*`, `VITE_*`, `NODE_OPTIONS`, the `APP_*` capture variables) are removed so the editor does not start as Electron's child.
- Before launch, main checks that the record's path is still a directory. "Command not found" (`ENOENT`) becomes `<Label> was not found. Pick another editor in Settings.`
- `installed` in `projects:launchers` is found by looking each command up on `PATH` once at startup (cached; refreshed when Settings opens).
- `APP_LAUNCH_DRY=1`, honoured only when not packaged, logs the argv instead of spawning, so the capture harness can check it.

## Renderer

### Shell changes

`renderer/apps/registry.ts` becomes `APPS = [projects]`. The `home` route goes: `Route` is `settings | app(appId, recordId)` and the default route is the projects app. `Home.tsx` and `Rail.tsx` are deleted; the title bar holds the wordmark, the `INDEX / 42 PROJECTS` meta, the palette button, a mode toggle and Settings. `ThemePicker` is removed (one theme); the light/dark mode and accent override stay in Appearance. Deep link `project-ops://open/projects/<id>` scrolls to and focuses that card; an unknown id just opens the grid.

### Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ PROJECT OPS.  │ INDEX / 42 PROJECTS                 [search commands] [◐][⚙]│
├───────────────┬────────────────────────────────────────────────────────────┤
│ ■ CATEGORY    │ [ search projects…        ]  SORT: LAST COMMIT ▾   18 / 42 │
│ All        42 ├────────────────────────────────────────────────────────────┤
│ Personal   27 │ ┌───────────────────────┐ ┌───────────────────────┐        │
│ Work       15 │ │ 01 / PERSONAL ■ ACTIVE│ │ 02 / WORK     PAUSED ⚑│        │
│ ■ TAGS        │ │ Project Ops           │ │ Invoice CLI           │        │
│ [DESKTOP APP] │ │ Organizer for coding… │ │ Batch invoices from…  │        │
│ [CLI] [TUI]   │ │ [DESKTOP APP][ELECTRON]│ │ [TERMINAL APP][CLI]  │        │
│ ■ STATUS      │ │ BRANCH        main ●  │ │ BRANCH       develop  │        │
│ ■ STACK       │ │ LAST COMMIT   2 days  │ │ LAST COMMIT  3 weeks  │        │
│               │ │ FOLDER ~/…/project-ops│ │ FOLDER  ~/…/invoice   │        │
│               │ │ 📁  </>  >_  ⧉  REPO↗ │ │ 📁  </>  >_  ⧉  SITE↗ │        │
└───────────────┴────────────────────────────────────────────────────────────┘
```

### Files in `renderer/apps/projects/`

`ProjectsApp.tsx` (state and wiring), `FilterRail.tsx`, `ProjectsToolbar.tsx` (search, sort, count, Rescan, Add folder), `ProjectCard.tsx`, `ProjectDialog.tsx` (edit), `projects.css` (classes prefixed `projects-`), pure `projectsModel.ts`, `index.ts`. Commands in the app definition **(call)**: focus search (`/`), new folder, rescan, clear filters; card actions are buttons, not shortcuts.

New common components, each used by the grid and Settings or the dialog: `Card`, `Badge`, `TagInput` (with a pure model: add on Enter or comma, dedupe case-insensitively, Backspace removes the last tag, suggestions from existing tags), `KeyValue` (one trait row). New icons in `Icon.tsx`: folder, code, terminal, copy, pin, external link, refresh.

`renderer/hooks/pushStore.ts` extracts the "initial invoke, then replace on push event, latest request wins" logic that `useCollection` and `useSettings` both hand-roll today. `useProjects`, `useRoots` and `useSettings` build on it.

Settings gains a Projects section: the scan roots list (add, remove, project count), the editor and terminal pickers (`Dropdown`, uninstalled entries disabled with "not found"), and a Rescan button.

### Filter and sort model (`projectsModel.ts`)

- **Search:** split the query on whitespace; every word must match (case-insensitive substring) at least one of name, description, tags, category or stack labels.
- **Category:** one value or all; `""` shows as "Uncategorised".
- **Tags:** any number selected; a project must have all of them (AND).
- **Status:** any subset; default active and paused shown, archived hidden **(call)**.
- **Stack:** any subset; a project matches if it has any selected stack (OR) **(call)**.
- **Sort:** name (A to Z, locale compare), last commit (newest first, null last), added (`createdAt`, newest first). Pinned projects always come first, then the chosen order.
- **Facet counts:** each filter value's count is computed with every other filter applied but not its own, so the numbers say what you would get by clicking.
- Missing projects stay in the grid with a "Missing" badge and disabled open buttons; Refresh and Remove still work.
- Filters, search and sort are kept in `localStorage` (try/catch) so they survive a restart **(call)**.

## Theme: Kojima

`renderer/theme/themes/kojima.css`, the only theme; `shared/theme.ts` lists only `kojima` and its `WINDOW_BG`. The 12 base tokens (`tests/theme.test.ts` requires exactly these and checks contrast):

| Token | Dark (default) | Light |
|---|---|---|
| `--bg` | `#141310` | `#efebe0` |
| `--surface` | `#1c1b17` | `#f8f5ed` |
| `--surface-raised` | `#27251f` | `#e1dccf` |
| `--text` | `#efebe0` | `#141310` |
| `--text-muted` | `#aaa596` | `#625e53` |
| `--line` | `#3f3b31` | `#c4beaf` |
| `--accent` | `#ff4d00` | `#ff4d00` |
| `--accent-text` | `#ff4d00` | `#ad2f00` |
| `--accent-ink` | `#141310` | `#141310` |
| `--danger` | `#ff8a7a` | `#a3261a` |
| `--danger-ink` | `#141310` | `#ffffff` |
| `--success` | `#8fd18a` | `#256331` |

The plan's adjusted values (dark raised `#27251f`, light accent text `#ad2f00`, the danger and success pairs) replace Kojima's originals where they differ, because the contrast test requires them. **(call)** `--accent-ink` is charcoal in both modes: white on `#ff4d00` is about 3.3:1 and fails, charcoal is about 5.6:1. The ink values are the builder's to adjust if the test says otherwise; the test is the judge.

Design language, from `kojima.css`:

- **Radius 0 and no shadows anywhere.** `tokens.css` sets `--r: 0` and `--shadow-float: none`; menus and dialogs separate by a 1px line and `--surface-raised`.
- **Hairlines.** 1px `--line` borders; grids are drawn with shared borders (each cell draws its right and bottom edge, the container its top and left), not gaps.
- **Type.** Headings in DM Sans 700 with `-0.035em` tracking, from `@fontsource/dm-sans` (replacing Barlow; bundled, no CDN, no `data:`). Body in DM Sans 400. Labels, buttons and badges in the system monospace stack (`ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`), 12px, weight 500, `+0.1em` tracking, uppercased with `text-transform`. Source copy stays sentence case.
- **Meta rows.** `NN / LABEL` on the left, status on the right, `justify-content: space-between` (the card's `01 / PERSONAL ■ ACTIVE`). `NN` is the card's position in the current order, two digits.
- **Status lights and bullets.** 5 to 8px solid orange squares, for section headings in the rail, the active status and the dirty-tree marker. Paused and archived use `--text-muted` squares.
- **Trait rows.** Key/value rows (`BRANCH main`) separated by `border-top`, key in the mono label style, value in body text.
- **Links.** External links end with `↗`.
- **Wordmark.** "Project Ops" with the full stop in `--accent`.
- **Focus.** `outline: 2px solid var(--accent-text)` with `outline-offset: 3px` on every focusable element.
- **Motion.** 150 ms colour transitions on hover, and an RGB-split glitch (two offset `text-shadow` copies in accent and text colours, a few frames) on primary button hover only. Both off under `prefers-reduced-motion`.

The 2 px radius and "no all-caps, no mono labels, no arrows" rules in the old Blueprint design and `CLAUDE.md` are replaced by these; the commit 16 docs rewrite updates `CLAUDE.md` to match.

## Brand

`shared/brand.ts`: name "Project Ops", package `project-ops`, `appId` `com.areimel.projectops` **(call)**, scheme `project-ops` (`project-ops://open/projects/<id>`), `defaultTheme: "kojima"`, `defaultMode: "dark"`. `mediaScheme` goes with the Player. Env prefix stays `APP`. `package.json` and `electron-builder.yml` change in step (`tests/brand.test.ts`). `userData` moves with the new product name; there is nothing to migrate.

## Export, import and reset

`store/bundle.ts` keeps its shape: `{format: "project-ops", version: 1, exportedAt, settings, collections}` with `collections` holding `projects` and `projectRoots`. Import replaces only what the file contains and heals every record with the full heals (main is the importer, so paths in the file are accepted; they are the user's own export). Reset clears both files and settings. Exports contain absolute folder paths; importing on another machine gives missing projects until the user rescans.

## Verification

- `pnpm typecheck && pnpm test` after every commit, exit status checked directly.
- New pure tests: project heal and patch heal (path and scan keys ignored, non-https links dropped), `toProjectView` (no absolute path, display path), `projectScanCore` (markers, skip list, depth, stack, category prefill, `mergeScan` including hidden and missing), `gitInfoCore` parsers and URL cleaning, `launchCore` (argv per entry, env cleaning), `projectsModel` (search, each filter, facet counts, sort with pins), `pushStore`, the tag input model.
- Capture harness: build without the dev server, throwaway `--user-data-dir`, seeded `projects.json` and `project-roots.json` over a fixture folder tree in the scratchpad. Screenshots at 1280x800 in dark and light with long names, a missing project and the empty state. `APP_CAPTURE_EVAL` calls `projects:list` and checks that no string starts with `/`. A scan run through eval, then the card count, and a hidden project still hidden. `project-ops://open/projects/<id>` focuses the card. `APP_LAUNCH_DRY=1` logs the editor argv. No CSP or font errors in the log.
- A real scan of `~/code_projects` in a throwaway profile; read-only on the projects.
- Not machine-checkable, reported as untested: the folder picker dialog, real editor and terminal launches (including from an installed `.deb`), clipboard on Wayland, opening the file manager.

## Known trade-offs

- A moved or renamed project folder shows as missing, and a new card appears at the new place without the old edits.
- A hidden project can be brought back only by undo; there is no "show hidden" view in this version **(call)**.
- Git info is as fresh as the last scan or refresh; nothing watches the folders.
- Exports contain absolute paths.
- Launcher detection is by command name on `PATH`; a Flatpak or Snap editor that is not on `PATH` shows as not found.

## Left to the builder

Exact component APIs and props, file splits within the 300-line rule, the shape of `pushStore`, icon drawings, copy wording, the empty state's text and action ("Add a scan folder"), how the toolbar shows the last scan time, and test selection beyond the list above. Anything marked **(call)** may be changed if the code argues for it; record the change in this file.

## As built

Added after the build, checked against the source on 2026-11-18. The text above is the design as written and is left as it was. Where it differs from what follows, the code wins. Items marked "new" are things the design did not mention.

### Files and names

- The shared project code is a folder, `shared/projects/` (`record.ts`, `patch.ts`, `view.ts`, `roots.ts`, `index.ts`), not `shared/projects.ts` and `shared/projectRoots.ts`. The launcher table is `shared/launchers.ts` as designed.
- The roots collection is named `project-roots` (`rootSpec.name`). In an export, `collections` holds `projects` and `"project-roots"`, not `projectRoots`.
- Limits as designed (`PROJECT_LIMITS`, root limit 20 in `ROOT_LIMIT`); new: `branch` 255, `stack` 24 ids of 32 characters per project.

### IPC (`shared/ipc/projects.ts`)

- `projects:list` returns `ProjectView[]` only. Roots have their own channel, `projects:roots-list`, and their own push, `projects:roots-changed` (sent only when the root views actually changed, so a project edit that changes no count sends nothing). `projects:changed` carries `ProjectView[]`, not `{projects, roots}`. New push: `projects:scan-state` (`{scanning}`), used to disable Rescan.
- `projects:restore` and `projects:refresh` return nothing (the page follows the `projects:changed` push), not a `Project`. `projects:add-folder` returns `{id} | null` and does not refresh anything beyond reading the folder once; the page focuses the new card by id. `projects:roots-add` returns the `RootView` (or null) and starts a scan in the background without waiting.
- `projects:scan` returns `{added, missing, total}` (total is the visible count), not `{found, added, missing}`.
- `projects:launchers` returns `{editors: string[], terminals: string[]}`, the ids found on `PATH`, not `{id, label, installed}` objects; labels come from the table in `shared/launchers.ts`. The result is cached in main for 30 seconds; Settings has a "Check again" button, and nothing refreshes it when Settings opens.
- `projects:update` takes the patch as an unvalidated value (`v.raw`) and heals it in main with `healProjectPatch`, as designed.
- A missing folder makes `projects:open` fail with `Folder not found`, not the longer message in the design. A program that was not found fails with `<Label> was not found. Choose another in Settings.`

### Record and view

- The view carries `overrides` (the owner's stored `name`, `description` and `links`) and `detected` (`name`, `description`, `repo`) instead of `nameIsDetected` and `descriptionIsDetected`, plus `scannedAt`. The edit dialog fills its fields from `overrides` and shows `detected` as placeholders.
- `links` in the view are effective links. The repo link falls back to the detected remote (`scan.repoUrl`) at read time (`effectiveLinks`); a scan never writes `links.repo`. The design said a scan prefills it. Opening Repo uses the same fallback.
- `folder` is `displayPath(path, home)` with a 40-character limit: `~` for the home folder, and when too long and more than three segments the first segment, `…` and the last two segments.
- Detection always fills `scan.name`, so it is only null before the first scan. Correction (later): it is always the folder name; `package.json` supplies the description and stack only, because cloned template sites share one package name. The design's "manifest name or folder name" (the `scan` field text above) no longer applies.
- Correction (later): removing a scan root keeps its hidden tombstones too (so a removed project does not return through another root and root counts stay right); all its projects stay with `rootId: null`, and a found scan record whose root is gone is adopted by the root that found it. They are re-checked for `missing` by the next scan (`statTargets`), not by refresh.
- A hidden project is brought back by Undo, or by adding the same folder again with "Add folder" (it is un-hidden, as designed for manual folders, and this works for scanned ones too). There is still no view of hidden projects.

### Scan and git

- Skip list: `node_modules vendor dist build out target venv .venv __pycache__` and every dot-folder. `coverage` is not in it. Markers added to the design's list: `requirements.txt`, `Makefile`, `build.gradle.kts`, `deno.jsonc`, `pubspec.yaml`, `mix.exs`, and `.sln` or `.csproj` files by pattern. Stack ids: node, typescript, react, vue, svelte, astro, next, electron, vite, tauri, rust, python, go, php, ruby, java, dotnet, c-cpp, dart, elixir, deno, docker.
- Name and description are read from `package.json` only. `Cargo.toml` and `pyproject.toml` are not read.
- `package.json`, `.git/HEAD` and `.git/config` are read through `smallFile.ts` (regular files, no symlinks, byte caps: 512 KB for `package.json`, 64 KB for git files). New.
- **Plain-config rule (new).** Git runs only when `.git` is a real directory whose `config` has nothing but allowlisted keys and plain values, with no `config.worktree`, `commondir`, `modules` or `.gitmodules`. Otherwise no git process runs; branch and remote come from `.git/HEAD` and `.git/config`, and last commit and dirty stay null. A `.git` pointer file gives nothing. See `CLAUDE.md` and `docs/guides/projects.md`.
- Correction (later): git is also pinned to the validated folder (`--git-dir`, `--work-tree`, ceiling directory, `.git/HEAD`, `objects/` and `refs/` must exist, inherited `GIT_*` stripped). The allowlist also has `branch.<name>.github-pr-base-branch` and `core.hookspath` (hooks are overridden by `-c core.hooksPath=/dev/null` on every call).
- Where git runs: an absolute `git` found once by `which`, extra `-c` options that switch off fsmonitor, hooks, attributes files and submodule recursion, `--ignore-submodules=all` on status, `GIT_CONFIG_NOSYSTEM=1`, 5 s timeout, 1 MB output cap, four repositories at a time.
- Hidden records are not read with git during a scan (`gitTargets` leaves them out). Records the scan does not settle (manual ones, ones whose root was removed) get a folder-exists check (`statTargets`).
- One scan runs at a time; import, reset, root removal and shutdown supersede it, as well as a newer scan. The merge and the single `replaceAll` have no `await` between them.

### Launchers

- A table entry is `{id, label, platforms}` where `platforms` maps `linux`, `darwin` and `win32` to a builder from the folder to `{command, args}`, not a flat `{id, label, platform, command, args}`. Editors: VS Code, Cursor, Zed, Sublime Text, VSCodium. Terminals as designed, plus Windows Terminal and macOS Terminal entries (untested).
- **Absolute program resolution (new).** The command is resolved to an absolute file from absolute `PATH` entries only (`which.ts`, `resolveOnPath`); a bare name is never spawned, because the child's working directory is the project folder. A program inside the project folder is refused.
- Windows `.cmd` entries will probably not start with `shell: false`; this is left as is on purpose (comment in `launch.ts`).
- `APP_LAUNCH_DRY=1` also covers the folder target. On macOS a bundle folder is revealed in its parent instead of opened (new).
- Settings: programs that were not found stay selectable, marked "not found", and the default "Automatic" names the program it would use. The design said not-found entries are disabled.
- Network (UNC) paths are refused in project and root records (`isNetworkPath`) and at the folder dialog; import heals them away. Import restores collections it already replaced if a later write fails (`applyCollections`).
- Dev only: `APP_PICK_FOLDER=/abs/dir` stands in for the folder dialog.

### Renderer

- Tag counts in the rail show what a click would give (an excluded tag shows how many it hides); an open suggestion list closes on the first Escape before the dialog does. Shared helpers: `useAttempt`, `utils/plural`, `utils/projectText`, `utils/cx`, `electron/features/fsUtil.ts`.
- Filters have an exclude list for tags (`excludeTags`): clicking a tag in the rail cycles off, include, exclude; the design had include only. Sort has a fourth option, "Last edited" (`updatedAt`). Search also matches branch and folder.
- Commands: `projects.search` (`/`), `projects.add-folder` (Ctrl/Cmd+O), `projects.rescan` (F5), `projects.clear-filters` (no key; active only when a filter is set).
- Links are shown as a "Links" trait row on the card (Repo, Site, Docs, each with an arrow), not in the footer. The footer starts with a labelled "Editor" button (open in editor), then icon buttons for open folder, open terminal, copy path, pin and edit.
- Design tweaks (2026-11-19): cards sit apart with a gap and their own borders, not a hairline grid with shared borders. The header strip has no `NN /` number (it was only the sort position) and leads with the category. Trait rows leave out an empty stack or links row, and a folder with no git shows one "Git: None" row (`traitRows` in `cardModel.ts`). Only the top of the trait block has a rule. Tags (card and rail) use the text face in sentence case, not the mono label. When the result has pinned and unpinned projects, the grid splits under "Pinned" and "Other projects" headings (`pinnedSplit`). Filters other than search appear as removable chips under the toolbar (`activeFilters` in `filterState.ts`). The dark surface is #201f1a.
- Remove exists only in the edit dialog, followed by an Undo toast. There is no per-card remove or refresh button; `projects:refresh` is wired in the hook but the screen has no control for it.
- The project count is in the footer's title block, not an `INDEX / 42 PROJECTS` row in the title bar. The toolbar shows the result count (`18 / 42`) and no last-scan time. The wordmark is a button that goes home. Escape leaves Settings.
- Filters, search and sort are stored in `localStorage` under `projects.view.v1`, healed on read. A deep link to a project resets filters that hide it, scrolls to it and marks it.
- `pushStore` is used by `useProjects`, `useRoots`, `useScanState`, `useLaunchers` and `useSettings`.
- New common components beyond the design's list: `StatusDot`, `Combobox` and `SuggestionList` (shared by `TagInput`), and the card's `CardHeader`, `CardBody` and `CardFooter`.

### Theme, brand and CSP

- Kojima as designed, including radius 0 and no shadows. `--accent-ink` is charcoal in both modes.
- The CSP's `media-src` is `'none'` (the design's earlier text, inherited from the template, named the media scheme). The page's scheme is `project-ops-app://renderer/`.
- `electron/features/tray.ts` still exists and the `closeToTray` setting stays, but `setTrayStatus` had no caller and was removed afterwards; the tray menu is Show and Quit.

### Known trade-offs: changes

The moved-folder, exports-contain-paths and git-freshness trade-offs stand. The "only by undo" trade-off is softened as described above. Added: a repository with a non-plain config shows no last-commit time or uncommitted-changes marker.
