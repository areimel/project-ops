# Remove a demo

Each demo is a folder in `renderer/apps/` and one entry in the registry. Demos that need the main process also have IPC channels and feature files. Remove one demo at a time and run `pnpm typecheck && pnpm test` after each; the type checker finds most leftovers.

The shell, Settings, themes, the collection store, `useCollection`, IPC, the common components and `shared/commands.ts` are not part of any demo. Keep them.

## Every demo

1. Delete `renderer/apps/<id>/`.
2. In `renderer/apps/registry.ts`: remove the import and the entry in `APPS`. Sheet numbers, the rail, the Go menu, the palette and `Ctrl/Cmd+1..9` follow the new order.
3. In `tests/registry.test.ts`: remove the id from the expected list (line 7) and rename the test.
4. Delete the demo's tests in `tests/apps/` (listed below).
5. Optional: `website/src/config/content.ts` lists the demos for the site (`demos`).

A leftover entry is harmless to remove later; leftover code that nothing imports still compiles, so delete what the list below says rather than waiting for an error.

## Per demo

The main-process files are only needed by the demo named. "Index lines" means the import and the list entry in `shared/ipc/index.ts` (the `IPC_PARTS` object and the `IPC` spread) and the import and list entry in `electron/ipc/index.ts`.

### Notes (renderer only)

- Tests: `tests/apps/notesModel.test.ts`, `tests/apps/saveTracker.test.ts`.
- Its collection `notes` can stay: nothing breaks and no file is created until something writes. To remove it, delete `shared/collections/notes.ts`, its line in `shared/collections/index.ts`, and fix the tests that import it (`tests/store/heal.test.ts`, `tests/store/collection.test.ts`, `tests/validate.test.ts`), and the import text in `renderer/settings/DataSection.tsx` (line 27).

### Tasks (renderer only)

- Test: `tests/apps/tasksModel.test.ts`.
- Collection `tasks`: same choice as Notes. `tests/store/collection.test.ts` uses the tasks spec as its main sample, so keep the spec file if you only want the sheet gone.

### Editor

- Delete: `shared/ipc/editor.ts`, `electron/ipc/editor.ts`, index lines.
- Delete: `electron/features/recents.ts`, `electron/features/recentsShape.ts`, `tests/main/recentsShape.test.ts`. Then remove `clearRecents` from `electron/store/dataTransfer.ts` (import and the call in the reset).
- `electron/features/files.ts` holds the shared open/save dialogs (`pickOpenFile`, `pickSaveFile`), which Player and data export/import also use, so keep the file. Remove the Editor-only parts: file handles, `openTextFile`, `readTextFile`/`writeTextFile` if unused, `queueLaunchFile`/`takePendingFile` (line 81 names the `editor` app). Remove `queueLaunchFile` from `electron/main.ts` (import, `routeArgv`, the `open-file` handler and the block in `whenReady`).
- `electron/features/filesCore.ts` and `tests/main/files.test.ts`: keep `displayFolder` and the rest if you keep any file feature; otherwise delete both.
- Tests: `tests/apps/editorModel.test.ts`, `tests/apps/markdown.test.ts`.
- `electron/features/home.ts` (home folder for display paths) is used only by the Editor's files and recents code; delete it if nothing else imports it.
- Dependencies: if nothing else uses Markdown, `pnpm remove markdown-it @types/markdown-it` and delete the markdown-it entries from `THIRD_PARTY_NOTICES.md`.
- `electron-builder.yml` has a commented `fileAssociations` block for `.md`; delete it.
- `electron/features/deepLinkParse.ts` still recognises `.md` arguments (`argvTargets`); harmless, but you can drop the file branch and its test in `tests/main/deepLink.test.ts`.

### Clipboard

- Delete: `shared/ipc/clipboard.ts`, `electron/ipc/clipboard.ts`, index lines, `tests/apps/clipboardModel.test.ts`.
- Collection `snippets`: keep or remove as for Notes (`tests/store/heal.test.ts` uses it).

### Timer

- Delete: `shared/ipc/timer.ts`, `electron/ipc/timer.ts`, index lines, `electron/features/timer.ts`, `electron/features/timerModel.ts`, `tests/apps/timerModel.test.ts`.
- `electron/main.ts`: remove the `shutdownTimer` import and its call in `shutdown()`.
- `electron/features/notifications.ts` is used only by the Timer. Keep it if you want notifications in your own app; otherwise delete it and the "Notifications" switch in `renderer/settings/SettingsScreen.tsx` (the `notifications` setting in `shared/settings.ts` and its tests are separate; leave them or remove everywhere).
- `electron/features/tray.ts` is created in `main.ts` and used by close-to-tray, so it stays unless you also remove the tray (then `createTray`, `hasTray`, the `closeToTray` setting and its Settings switch go too).

### System info

- Delete: `shared/ipc/system.ts`, `electron/ipc/system.ts`, index lines, `electron/features/systemInfo.ts`, `electron/features/systemModel.ts`, `tests/apps/systemModel.test.ts`.

### News

- Delete: `shared/ipc/news.ts`, `electron/ipc/news.ts`, index lines, `electron/features/news.ts`, `electron/features/newsModel.ts`, `tests/apps/news.test.ts`.
- `electron/store/dataTransfer.ts`: remove the `clearNewsCache` import and its call in the reset.
- The allowlisted host: `NET_HOSTS` in `electron/features/netCore.ts` is `hacker-news.firebaseio.com`. Keep `net.ts`/`netCore.ts` and `tests/main/net.test.ts` if you will call any API from your own app (change the host list); otherwise delete them. `openExternalHttps` in `electron/features/links.ts` is used only by News; keep or delete.
- The packaged page's CSP already forbids network access (`connect-src 'none'`), so no CSP change is needed.

### Player

- Delete: `shared/ipc/player.ts`, `electron/ipc/player.ts`, index lines, `electron/features/media.ts`, `electron/features/mediaRange.ts`, `shared/mediaTypes.ts`, `electron/features/powerSave.ts`, `renderer/hooks/useFullscreen.ts`, `tests/apps/playerModel.test.ts`, `tests/apps/playerRange.test.ts`.
- `electron/main.ts`: remove the `media` and `powerSave` imports, `MEDIA_SCHEME_ENTRY` in `registerSchemesAsPrivileged`, `registerMediaProtocol()`, and the `clearServed()` and `setPreventSleep(false)` calls in `shutdown()`.
- CSP: `shared/csp.ts` has `media-src <mediaScheme>: blob:`. Change it to `media-src 'self'` or drop the line, and update `tests/main/csp.test.ts` (line 16). `brand.mediaScheme` can then go from `shared/brand.ts`.
- Keep the `window:toggle-fullscreen` channel: the shell's F11 command uses it.

## Check

- [ ] `pnpm typecheck && pnpm test` exit 0
- [ ] `pnpm dev`: home menu shows the remaining sheets with correct numbers; palette and `?` help list no removed command
- [ ] Settings > Data > Reset all data still works
- [ ] search the repository for the demo's name (`grep -ri "<name>" electron shared renderer tests website/src/config`) and for leftover imports
