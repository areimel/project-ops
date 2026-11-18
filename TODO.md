# TODO

Things that still need a person. The code and the docs are finished; these are what tests and screenshot runs cannot settle.

## Before using or publishing the template

- [ ] Set the real project links: `links.website` (now `https://example.com/`) and the repository URL in `shared/brand.ts`, then the same values in `package.json` (`homepage`, `repository.url`). `tests/brand.test.ts` keeps them in step.
- [ ] Confirm the repository URL and Pages address used by the website (`website/src/config/product.ts`, `deploy.ts`).
- [ ] Replace the generated placeholder icons in `build/` with real artwork.
- [ ] Website: get a Web3Forms access key, set `PUBLIC_WEB3FORMS_ACCESS_KEY` (`website/.env` locally, an Actions secret for the deploy), and send one real signup and one real contact message to check delivery.
- [ ] Harden the packaged app with Electron fuses (`@electron/fuses`): it still accepts `--remote-debugging-port` and similar switches, which is Electron's default.

## Try by hand (never exercised by a person)

- [ ] Tray icon and its menu; the Timer's tray status text
- [ ] Notifications: look, click-through, the Settings switch
- [ ] Close to tray (Settings) and quitting with unsaved Editor changes
- [ ] File dialogs: Editor open and save, Player open, data export and import
- [ ] Drag and drop from a file manager into the Editor and the Player
- [ ] Clipboard on Wayland; fullscreen in the Player
- [ ] Following a live system light/dark change in "System" mode
- [ ] Keyboard-only use: focus order, the palette
- [ ] Install the `.deb` (`pnpm dist` builds it, and the unpacked build was started once by machine), then deep links (`app-template://open/notes`) and, if enabled, the `.md` association
- [ ] `pnpm dist:win` on Windows and `pnpm dist:mac` on a Mac

## Maybe later

- Auto-update, multiple windows, translations, SQLite, code signing: outlines in `docs/guides/not-built.md`.
- An apt repository or Flatpak, so installs and updates go through the system.
