# Electron App Template: design

Date: 2026-11-17. Status: approved by Alec (plan review). Items marked **(call)** were decided by the planner, not by Alec, and may be changed.

## Intent

Turn this copy of the Shader Video Player into a general desktop app starter. Alec does not usually build desktop apps; he wants to clone this for future apps and learn desktop development from it. So the template must be small enough to read, show one clear way to do each common desktop job, and be easy to cut down.

The `website/` folder becomes a matching, rebrandable marketing-site template.

## Goals

- Opens on a main menu that links to 8 small demo apps. Each demo teaches a different desktop skill.
- Shared plumbing: theme and branding system, generic CRUD over saved data, settings, window state, native menu, tray, notifications, file dialogs, clipboard, network calls, logging.
- A new look ("Blueprint") that owes nothing to the video player's CRT design.
- Rebrand by editing one file (`shared/brand.ts`; `website/src/config/site.ts` for the site).
- Delete a demo by removing its folder and one registry line.
- Less code than the player, files under ~300 lines, shared pieces reused (extract at three uses).

## Non-goals

Auto-update, multiple windows, translations (i18n), SQLite, code signing. Each gets a short "how to add" note in `docs/guides/`. **(call)**

## Anti-goals

- A framework. No plugin loader, no dependency injection, no abstractions that exist only for hypothetical future apps.
- Demos that grow into products. A demo is a few small files.
- Loosening the security model to make a demo easier.

## Decisions

| Topic | Decision |
|---|---|
| Old code | Remove shaders, ffmpeg, library, queue, subtitles, canvas home screen. Keep a slim native-only player as one demo |
| Storage | JSON files in `userData`, on the existing `electron/jsonStore.ts` |
| Demos | Notes, Tasks, Editor, Clipboard, Timer, System info, News (Hacker News), Player. Settings (with the theme editor) is part of the frame, not a demo |
| Layout | Full home menu. Inside a demo: slim icon rail on the left, title bar on top |
| Look | Blueprint default theme; other themes and light/dark switchable |
| Platforms | Linux tested (`.deb`). Windows and macOS build targets configured and platform differences handled in code, untested |
| Brand **(call)** | Placeholder name "App Template", package `electron-app-template` |
| Network **(call)** | Requests go through the main process with a host allowlist; the page's CSP stays closed |
| Timer **(call)** | Timer state lives in the main process, so it survives navigation and drives the tray and notifications |
| Markdown **(call)** | `markdown-it` with HTML disabled |

## Approaches

1. **Feature folders + registry (chosen).** Each demo is one renderer folder, optionally one main-process file, and one registry line. Home menu, rail, command palette and native menu are generated from the registry and the command table. Matches the repo's existing "declared once" pattern.
2. **One window per demo.** Teaches multi-window but needs state sync and triples the frame code.
3. **Demos as packages in a monorepo.** Clean isolation, heavy tooling for something meant to be copied and cut down.

## Architecture

```
shared/
  brand.ts            name, ids, links, default theme: the one rebrand file
  ipc.ts              typed channel map {channel: {args, result}}; channel names declared once
  commands.ts         existing helpers kept; groups become data; apps contribute commands
  collections/        per-collection record type + heal(): notes, tasks, snippets
  settings.ts         settings shape + heal
  superseded.ts       kept
electron/
  main.ts window.ts   trimmed; ready-to-show, saved window state, macOS activate
  ipc/                handle() wrapper that validates args; one register file per feature
  store/              jsonStore.ts (kept), collection.ts (generic list/get/create/update/remove,
                      {version, items} envelope, change events), settings.ts, windowState.ts
  features/           tray, notifications, logger, links, deepLink, net (allowlisted fetch),
                      files (open/save dialogs, recents, .md association), clipboard,
                      timer, systemInfo, news, media (file protocol + allowlist)
  menu.ts             built by iterating command groups
  devCapture.ts       kept; env prefix APP_CAPTURE_*
renderer/
  theme/              tokens.css (semantic names), themes/{blueprint,graphite,kraft}.css,
                      useTheme (follow system, accent override)
  shell/              AppShell, Home (sheet index), Rail, TitleBar, TitleBlock, CommandPalette,
                      ShortcutHelp, ErrorBoundary, router (reducer: home | appId | settings)
  apps/registry.ts    AppDefinition {id, name, icon, summary, component (lazy), commands}
  apps/<id>/          notes tasks editor clipboard timer system news player
  settings/           Settings screen, ThemeEditor, data export/import/reset
  components/common/  existing 10 restyled, plus new primitives only where used 3+ times
  hooks/              useCollection(name), useShortcuts, useDismiss, useLatest, useFullscreen, useSetting
```

### Security model (kept from the player)

- Renderer is sandboxed with context isolation and treated as untrusted.
- New IPC goes `shared/ipc.ts` → `preload.ts` → `electron/ipc/`, and every argument is validated in main.
- The renderer never supplies a path string. Files come from main-process dialogs or real drops (`webUtils.getPathForFile` in the preload).
- Collections are addressed by an allowlisted name; records by an opaque id; payloads pass through the collection's `heal()`.
- Media: one servable file at a time (`allowlist.ts`), extension-checked.
- External links: https only, opened by main.
- Network: main-process fetch to allowlisted hosts only.

### Stored data

Flat files in `userData`, names matching `^[a-z0-9-]+\.json$`: `settings.json`, `window-state.json`, `recents.json`, `notes.json`, `tasks.json`, `snippets.json`. Collections use `{version, items}`. Every read goes through a `heal()` that accepts `unknown` and returns a valid value, so a damaged or stale file never crashes the app. Writes are atomic (temp file + rename).

### What each demo teaches

| Demo | Skill |
|---|---|
| Notes | CRUD through `useCollection`, search, debounced autosave |
| Tasks | CRUD, filters, reorder, undo from a toast |
| Editor | Open/save dialogs, recent files, drag-and-drop, unsaved-changes guard, file association, Markdown preview |
| Clipboard | System clipboard read/write, saved snippets |
| Timer | Main-owned state, native notifications, tray |
| System info | Live data pushed from main while subscribed |
| News | API calls through main, cache, loading/offline/error states, external links |
| Player | Custom file protocol, allowlist, fullscreen |

## Visual design: Blueprint

Subject: a starter kit you build on, drawn as a set of engineering drawings.

**Semantic tokens** (the app and the website use the same names):
`--bg` (window ground), `--surface` (sheet), `--surface-raised`, `--text`, `--text-muted`, `--line`, `--accent`, `--accent-ink` (text on accent), `--danger`, `--success`, plus derived `--hover`, `--selected`, `--scrim`.

| Token | Light "Vellum" | Dark "Cyanotype" |
|---|---|---|
| `--bg` | `#EEF2F6` | `#0F2A52` |
| `--surface` | `#FBFCFE` | `#163868` |
| `--text` | `#14315C` | `#E6EEFA` |
| `--text-muted` | `#5E7391` | `#A9BEDD` |
| `--line` | `#9DB4D3` | `#4F76AE` |
| `--accent` | `#D1345B` | `#FFD166` |

Remaining values (raised surface, accent ink, danger, success) are the builder's to derive, meeting WCAG AA contrast for text.

- **Type:** Barlow for text, Barlow Condensed for headings and the title block, bundled with `@fontsource` (no CDN). Sentence case. Tabular figures. No monospace except the Editor's text area.
- **The one bold element:** a drawing **title block** in the bottom-right corner of every screen (app name, "Sheet 3 of 8", record count, save state), and the home menu as a ruled **sheet index** (number, name, what it demonstrates), not a card grid. Sheet numbers are the real registry order. A faint drafting grid shows on the home screen only.
- **Everything else quiet:** 2 px radii, one line weight, no shadows on flat surfaces, motion only in answer to an action, `prefers-reduced-motion` respected, visible keyboard focus.
- **Avoid:** all-caps labels, eyebrow labels above headings, middle-dot meta strings, arrows appended to link text, monospace data labels, near-black backgrounds.
- **Other themes:** Graphite (neutral) and Kraft (warm paper), each with light and dark. A theme is one CSS file of semantic token values under `[data-theme][data-mode]`. The user can also override the accent.
- **Copy:** plain verbs, sentence case, buttons say what they do ("Save note"), an empty screen invites the first action, errors say what happened and what to do.

## Website

Astro, separate project and lockfile (unchanged rule). Same token names and Blueprint values, light and dark. Every string and product fact lives in `website/src/config/`; pages, forms, the install script and the tests read from it. `TvFrame` is replaced by a plain window frame for screenshots. Pages stay: home, download, docs, contact, 404. Screenshots come from the new app through the capture harness.

## Left to the builder

Exact component APIs, file splits, the IPC helper's shape, icon set, derived token values, test selection beyond the list in the plan, wording of copy.

## Verification

See the plan: gates per commit (`pnpm typecheck && pnpm test`), `pnpm build` at phase ends, screenshots of every demo and theme through `devCapture`, data-survives-restart check for CRUD demos, `.deb` built and inspected (not installed), website `check` / `build` / `test:browser`.
