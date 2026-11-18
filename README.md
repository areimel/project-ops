# App Template

A starter for desktop apps. It is a working Electron app that opens on a menu of eight small demo apps, each showing one thing a desktop app needs to do: keep data in files, open and save files, use the clipboard, run in the background, call the network safely, play a local file. Around the demos is the shared plumbing every app needs: themes, settings, a native menu, a tray, notifications and a safe way for the page to talk to the rest of the computer.

Clone it, rename it, delete the demos you do not need, and build your app on what is left. Read the code to learn how desktop apps fit together.

Stack: Electron 45, React 19, TypeScript (strict), Vite 8, esbuild for the main process, vitest, pnpm 11. License: MIT.

## Requirements

- Node 24 and pnpm 11 (the exact pnpm version is pinned in `package.json`; `corepack enable` provides it).
- Linux is where it was developed and tested. Windows and macOS builds are configured but have never been run.
- For rebuilding the placeholder icons only: ImageMagick (`convert`).

## Quick start

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the Vite dev server on port 5173 (it stops with an error if that port is taken; `APP_DEV_PORT=5199 pnpm dev` uses another), bundles the main process in watch mode and opens the window. Page changes reload live; main process changes need a restart.

Before a commit run `pnpm typecheck && pnpm test` and check that it exits 0.

## What is in the box

| Sheet | What it shows | What it teaches |
| --- | --- | --- |
| Notes | List, search, edit | Saved records through `useCollection`, search, 500 ms debounced autosave |
| Tasks | Checklist | Records, filters, reordering, undo from a toast |
| Editor | Text and Markdown files | Open and save dialogs, recent files, drag and drop, unsaved-changes guard, Markdown preview |
| Clipboard | System clipboard and snippets | Reading and writing the clipboard through the main process |
| Timer | Countdown | State kept in the main process, native notification, tray status |
| System info | CPU, memory, uptime | Live data pushed from main only while the sheet is open |
| News | Hacker News front page | Network calls through main, cache, loading, offline and error states, opening links safely |
| Player | One local video or audio file | A custom file protocol that serves a single chosen file, fullscreen |

Also built in: Settings (three themes, each in light and dark, an accent colour override, close to tray, notifications, export, import and reset of your data, About with the changelog and credits), a command palette (`Ctrl/Cmd+K`), a shortcut help (`?`), a native menu, deep links (`app-template://open/notes`) and a website template in `website/`.

## Make it your own

Start with `docs/guides/start-a-new-app.md`. In short:

1. Edit `shared/brand.ts`: name, tagline, package name, app id, URL scheme, links, author.
2. Make the copies match, or `pnpm test` fails (`tests/brand.test.ts` checks them): `package.json` (`name`, `productName`, `description`, `author`, `homepage`, `repository.url`, `desktopName`) and `electron-builder.yml` (`appId`, `productName`, `copyright`, the deep-link scheme, `executableName`, `artifactName`).
3. Replace the icons in `build/` (`icons/<N>x<N>.png`, `icon.png`, `tray.png`) with your own, or regenerate the placeholders with `node scripts/make-icons.mjs`.
4. Set the placeholders: `links.website` in `shared/brand.ts` is `https://example.com/`, and the repository URL (`github.com/areimel/electron-app-template`) is a guess.
5. Replace `LICENSE`, this README, `CHANGELOG.md` and `THIRD_PARTY_NOTICES.md`.
6. Remove demos with `docs/guides/remove-a-demo.md`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite + main process watch + Electron |
| `pnpm typecheck` | type-checks the page, shared code and tests, then the main process |
| `pnpm test` | vitest, pure logic only (no Electron window) |
| `pnpm build` | typecheck, then the page into `dist-renderer/` and the main process into `dist-electron/` |
| `pnpm dist` | build, then a Linux `.deb` in `release/` |
| `pnpm dist:win`, `pnpm dist:mac` | build, then a Windows installer or a macOS dmg (configured, never run) |
| `node scripts/make-icons.mjs` | regenerate placeholder icons |

## Project layout

```
electron/     main process: window, menu, tray, IPC handlers, file store, features
shared/       code both sides import: brand, IPC channel declarations, collections, commands, settings, themes
renderer/     the page: shell, apps/ (the demos), settings, theme, components, hooks
tests/        vitest tests
docs/guides/  task guides
website/      Astro site template
```

Some terms. The **main process** (`electron/`) is the Node side: it can read files, use the network and the OS. The **renderer** (`renderer/`) is the web page: sandboxed, so it cannot, and it is treated as untrusted. The **preload** script (`electron/preload.ts`) is the only bridge; it gives the page `window.app`. **IPC** is the messages that cross that bridge. `CLAUDE.md` describes how it all fits together in detail.

## Security model in brief

- The page runs sandboxed with context isolation and no Node access. Main checks every message it receives (who sent it, the channel, each argument).
- The page never supplies a file path or a URL. Files come from dialogs and real drops handled in main; the page gets opaque ids.
- The packaged page is served from a private scheme, not `file://`, with one Content-Security-Policy (the browser rule for what a page may load) that forbids network access from the page. Network calls go through main to an allowlist of hosts, https only.
- Stored data is read through validators, so a damaged or hand-edited file does not crash the app. A file it cannot read is moved aside, never overwritten.
- No camera, microphone or other permissions are granted; navigation, popups and webviews are blocked.

## Build and package

```bash
pnpm dist
```

Writes `release/electron-app-template_<version>_amd64.deb` (the name follows `artifactName` in `electron-builder.yml`). Installed builds register the `app-template://` link scheme. A `.md` file association exists in `electron-builder.yml` but is commented out: once installed it would make the app a candidate for every Markdown file on the machine; the comment there says how to turn it on. The `.deb` has not been installed and tried by a person.

## Website

`website/` is an Astro site for the app, with its own `package.json` and lockfile. Rebrand it through `website/src/config/`; `website/README.md` has the full guide.

```bash
pnpm --dir website install --frozen-lockfile
pnpm --dir website dev --background    # http://localhost:4321/electron-app-template/
pnpm --dir website check
pnpm --dir website build
pnpm --dir website test:browser
```

## Guides

- `docs/guides/start-a-new-app.md`: clone, rebrand, cut demos, first run
- `docs/guides/add-an-app.md`: a new sheet
- `docs/guides/remove-a-demo.md`: what to delete, per demo
- `docs/guides/add-a-stored-collection.md`: saved records
- `docs/guides/add-an-ipc-channel.md`: page to main process
- `docs/guides/add-a-theme.md`
- `docs/guides/add-a-command.md`: shortcut, menu item, palette entry
- `docs/guides/not-built.md`: auto-update, multiple windows, translations, SQLite, code signing (outlines only)
- `CLAUDE.md`: architecture and rules (also the instructions coding agents read)
- `docs/superpowers/specs/2026-11-17-app-template-design.md`: why it is built this way

## Known gaps

Checked by tests and screenshot runs, but never tried by a person: the tray icon and menu, notifications, close to tray, file dialogs, drag and drop from a file manager, quitting with unsaved Editor changes, deep links and the file association on an installed copy, the clipboard on Wayland, fullscreen in the Player, following a live system light/dark change, the installed `.deb`, the Windows and macOS builds, and real form delivery on the website. Not built: auto-update, multiple windows, translations, SQLite, code signing. See `TODO.md`.

## License

MIT, see `LICENSE`. Third-party notices are in `THIRD_PARTY_NOTICES.md`.
