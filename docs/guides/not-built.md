# Not built

These are outlines of what each missing feature takes, written from reading this codebase and general knowledge of Electron. None of it has been built or tested here. Treat each as a starting point to check, not as instructions.

## Auto-update

Apps update themselves by downloading a newer build from a feed (usually GitHub Releases). With electron-builder the usual package is `electron-updater`, plus a `publish` entry in `electron-builder.yml`, an update check in main (`features/updater.ts`) and a "restart to update" prompt that goes through the shell (a new `app:` channel or event). Gotcha: updating needs signed builds on macOS and is far smoother signed on Windows, and Linux support depends on the package format (check which targets your `electron-updater` version can update; a plain `.deb` installed through `install.sh` is updated by installing a new one). Also decide what happens to the close guard when an update restarts the app.

## Multiple windows

Today there is one window: `window.ts` keeps a single `win`, `getWindow()` returns it, `emit()` sends to it, `handle()` accepts calls only from its top frame, and window state, the close guard and `app:ready` are single values. Multiple windows means a registry of windows, `emit` and the sender check working per window, a guard and saved bounds per window, and the single-instance rule deciding which window a deep link goes to. Gotcha: every module that calls `getWindow()` (system sampling, timer notifications, dialogs, `data:changed` pushes) must say which window it means.

## Translations (i18n)

All copy is English, written inline. Moving it out means a message catalogue per language, a lookup in the page (a library such as i18next or a small `t()` of your own) and a language setting in `shared/settings.ts`. Gotcha: some strings live in main (native menu labels from `shared/commands.ts`, dialog titles, tray, notifications, error messages from `handle`), so main needs the catalogue too, and the menu must rebuild when the language changes. Helpers that build words or units (`renderer/utils/format.ts`, `renderer/apps/news/relativeTime.ts`) will need the locale too.

## SQLite

Data is JSON files (`{version, items}`), read whole and written whole, fine for thousands of small records and wrong for large or relational data. To move to SQLite keep the shape the page sees: implement the `Collection` interface in `electron/store/collectionCore.ts` over SQL in the main process only, so `useCollection` and the `data:*` channels do not change. Gotcha: a native module such as `better-sqlite3` must be built for Electron's Node version (and approved in `pnpm-workspace.yaml` `allowBuilds`) and unpacked from the asar in `electron-builder.yml`; Node's built-in `node:sqlite` avoids that if the Node bundled with your Electron version has it (check `process.versions.node`). Also write a one-time import of the old JSON files so existing users keep their data, and keep export/import working.

## Code signing

An unsigned app triggers warnings (Windows SmartScreen, macOS Gatekeeper, which blocks unsigned downloads outright on current macOS). Signing needs a certificate: an Apple Developer ID plus notarisation for macOS, a code-signing certificate for Windows. electron-builder reads them from environment variables (for example `CSC_LINK` and `CSC_KEY_PASSWORD`) and has `mac` notarisation settings. Gotcha: keep certificates and passwords in CI secrets, never in the repository, and sign on the matching platform (a Mac build can only be made and notarised on a Mac or a macOS CI runner). Linux `.deb` files are normally not signed individually; apt repositories are signed instead.
