## Install

Install the app from the Download page with the one-line installer. The installer finds the newest release, checks the package against the published checksums and installs it with apt. You can also download the `.deb` file from the GitHub releases page and install it yourself.

The app is built for 64-bit Linux, on Debian, Ubuntu and derived systems. It runs under Wayland or X11.

To build from source, clone the repository, then run these commands in its folder:

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the app with hot reloading. Building from source needs Node 24 and pnpm.

## The main menu

The app opens on a ruled sheet index. Each numbered row opens one small demo app, and each demo teaches one skill you will need in a real desktop app.

| Demo | What it shows |
| --- | --- |
| Notes | Creating, editing and deleting records through a shared collection hook, with search and autosave |
| Tasks | Filtering and reordering a list, and undoing a delete from a toast |
| Editor | Open and save dialogs, recent files, drag and drop, an unsaved-changes guard, file association and a Markdown preview |
| Clipboard | Reading and writing the system clipboard, and keeping saved snippets |
| Timer | State owned by the main process, with native notifications and a tray icon |
| System info | Live data pushed from the main process while the window is subscribed |
| News | API calls made through the main process, with a cache and loading, offline and error states |
| Player | A custom file protocol with an allowlist, and fullscreen |

The numbers follow the order of the demo registry. Settings is part of the app frame, not a demo, so it is not on the sheet index.

## Themes and settings

Three themes are included: Blueprint (the default), Graphite (neutral) and Kraft (warm paper). Each theme has a light and a dark variant. You can choose light or dark, or follow the system setting.

You can also pick an accent colour to replace the accent of the current theme. The choice is saved.

The Settings screen holds the theme editor and the data tools. Export writes your saved records to a file. Import reads that file back in. Reset clears the saved data so the app starts fresh.

## Where your data lives

Saved data is kept as plain JSON files in the app's user data folder. The folder depends on your operating system. The files are:

- `settings.json`: theme, mode and accent choices
- `window-state.json`: window size and position
- `recents.json`: recently opened files
- `notes.json`: notes from the Notes demo
- `tasks.json`: tasks from the Tasks demo
- `snippets.json`: saved clipboard snippets

Each collection file has a version number and a list of items. Writes go to a temporary file first and then replace the old file, so a crash during a save does not leave a half-written file behind.

Every read checks the file's contents. A damaged or out-of-date file is repaired on read: bad parts are replaced with valid values and the app keeps running. It never crashes because a file is wrong. To keep a copy of a damaged file, copy it before you start the app.

## Make it yours

To rename the app, edit `shared/brand.ts`. It holds the name, the identifiers, the links and the default theme, so one file changes the whole app. If you publish a website for it, edit the files in the website's `src/config/` folder as well.

To remove a demo, delete its folder under `renderer/apps/` and remove its line from `renderer/apps/registry.ts`. The menu, the navigation rail and the commands are built from the registry, so the demo disappears from all of them.

To add a demo, create a folder under `renderer/apps/` with the demo's component, then add one line to `renderer/apps/registry.ts` with its id, name, icon, summary and commands. Reuse the shared hooks, such as `useCollection`, for saved records.

## Security model

- The renderer, which is the window's web page, runs sandboxed with context isolation. It is treated as untrusted code.
- Every message from the page to the main process is declared in `shared/ipc.ts`, and the main process checks every argument before it uses it.
- The page never supplies a file path. Files come from the system open and save dialogs, or from files dropped on the window.
- Saved collections are addressed by allowlisted names, and records by opaque ids.
- Media is served one file at a time, and only after the file's extension is checked.
- External links must use https, and the main process opens them.
- Network requests are made by the main process, and only to allowlisted hosts.

## Troubleshooting

**The app does not start on Wayland.** Start it from a terminal with `--ozone-platform=x11` added to the launch command. This runs the app under X11.

**Settings are wrong or the app behaves oddly.** Close the app and delete `settings.json` from the user data folder. The app creates a fresh file with the defaults the next time it starts. You can also use Reset in Settings.

**A saved file is damaged.** Close the app, copy the damaged file somewhere safe, then start the app again. The app repairs the file on read.

**Something is broken.** Report it on the GitHub issue tracker linked from the Contact page. Include your Linux distribution, the version of the app and the steps that lead to the problem.
