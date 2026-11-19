# Project Ops

A desktop app that keeps your coding projects in one place. Point it at the folders where you keep your projects; it finds each one, reads its name, stack and git state, and shows it as a card. Filter by category, tags and status, search, then open a project in your file manager, code editor or terminal.

Stack: Electron 45, React 19, TypeScript (strict), Vite 8, esbuild for the main process, vitest, pnpm 11. License: MIT. Linux is where it was developed and tested; Windows and macOS builds are configured but have never been run.

## Run it

Needs Node 24 and pnpm 11 (the exact version is pinned in `package.json`; `corepack enable` provides it).

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the Vite dev server on port 5173 (it stops if the port is taken; `APP_DEV_PORT=5199 pnpm dev` uses another), bundles the main process in watch mode and opens the window. Page changes reload live; main process changes need a restart. Before a commit run `pnpm typecheck && pnpm test` and check that it exits 0.

## Use it

1. **Add scan folders.** The app opens on the dashboard; go to Projects (title bar) and on the empty screen choose "Add a scan folder", or open Settings (`Ctrl/Cmd+,`) > Projects > Add folder. Pick the folder that holds your projects, for example `~/code_projects`. A scan starts at once. A folder counts as a project when it contains a marker such as `.git`, `package.json`, `Cargo.toml`, `pyproject.toml` or `go.mod`; the scan looks up to four levels deep, skips dot-folders and `node_modules`-style folders, and does not look inside a project. A project's name is its folder name (`package.json` only supplies the description and stack). You can add up to 20 scan folders; folders on a network share (`\\server\share`) are refused, so map the share to a drive letter first. Removing a scan folder keeps its projects, including ones you removed. "Add folder" in the toolbar (`Ctrl/Cmd+O`) adds a single project folder instead.
2. **Rescan.** Nothing scans at startup. Use Rescan in the toolbar (`F5`) to pick up new projects and refresh branch, last commit and stack. A project whose folder is gone stays in the list marked "Folder missing".
3. **Describe projects.** The edit button on a card opens a form: name and description (empty uses what was detected), one category, tags, status (active, paused, archived), and repo, site and docs links (https only). The scan never overwrites these. A new project's category starts as the first folder under the scan folder.
4. **Filter.** The rail on the left filters by category (one), tags, status and stack, with counts (a tag's count is what clicking it would give). Clicking a tag cycles it: off, include (projects must have it), exclude (projects must not have it). Statuses default to active and paused, so archived projects are hidden until you turn them on. Search (`/`) matches name, description, category, tags, stack, branch and folder. Sort by last commit, name, date added or last edited; pinned projects always come first. Filters and sort are remembered between runs.

A card's buttons: open the folder in your file manager, open it in your code editor, open a terminal there, copy the path, pin or unpin, edit. Links on the card (Repo, Site, Docs) open in your browser; Repo falls back to the git `origin` remote when you have not set one. Settings > Projects chooses the editor and terminal (Automatic uses the first one found on your `PATH`; VS Code, Cursor, Zed, Sublime Text, VSCodium and several terminals are known).

Remove a project from the edit dialog; an Undo message follows. A removed project stays out of the list on later scans. Adding the same folder again with "Add folder" brings it back; there is no list of removed projects.

## Where data lives

JSON files in the app's data folder (Settings > Data > Show data folder): `projects.json`, `project-roots.json`, `settings.json`, `window-state.json` and `logs/`. Your folders are only read, never changed. Settings > Data exports projects, scan folders and settings to one file (it contains folder paths from this computer), imports one, or resets everything; reset does not touch your project folders.

## Build

```bash
pnpm build      # typecheck, renderer bundle, main bundle
pnpm dist       # .deb in release/ (Linux x64)
```

`pnpm dist:win` and `pnpm dist:mac` are configured but have never been run.

## Limits

- A project folder you move or rename shows as missing, and a new card appears at the new place without your edits.
- For a repository whose git config is not plain (anything beyond common keys: remotes, branches, user name, pull and push defaults), Project Ops does not run git. It still shows branch and remote read from the `.git` folder, but not the last commit or uncommitted changes. A `.git` file (worktree) and a repository with submodules show none of them.
- Git facts are as fresh as the last scan or refresh. Editors installed as Flatpak or Snap that are not on `PATH` show as not found.
- Never tried by a person: the real folder dialog, real editor and terminal launches, the tray, the installed `.deb`, and the Windows and macOS builds (Windows `.cmd` editor entries will probably not start). See `TODO.md`.

## For contributors

`CLAUDE.md` is the full guide (layout, rules, security model, how to check the app without a screen); `AGENTS.md` is the short version. Task guides are in `docs/guides/`, starting with `docs/guides/projects.md`. The design is `docs/superpowers/specs/2026-11-18-project-ops-design.md`. `website/` is a separate Astro product-site template that has not been rebranded.

`CHANGELOG.md` format (parsed for Settings > About): `## <version> - <date>` headings, newest first, each followed by `-` bullets.
