# TODO

What is left. Tests and screenshot runs cover the logic and the first paint; the items under "Try by hand" need a person.

## Before publishing

- [ ] Set the real project links: `links.website` (now `https://example.com/`) and the repository URL in `shared/brand.ts`, then the same values in `package.json` (`homepage`, `repository.url`). `tests/brand.test.ts` keeps them in step.
- [ ] Replace the generated placeholder icons in `build/` with real artwork.
- [ ] Harden the packaged app with Electron fuses (`@electron/fuses`): it still accepts `--remote-debugging-port` and similar switches (Electron's default).
- [ ] Update `THIRD_PARTY_NOTICES.md`: it still lists `markdown-it` and `babu-video-player` from the removed demos. Add notices for what the app now ships (Electron, React, DM Sans stay).
- [ ] Update the stale deep-link examples (`project-ops://open/notes`) in the comments of `shared/brand.ts` and `electron-builder.yml`.
- [ ] Rebrand `website/`: `website/src/config/product.ts` and the rest still say "App Template" and describe the eight demos (see `website/README.md`). Then get a Web3Forms key and check real form delivery.

## Try by hand (never exercised by a person)

- [ ] The folder dialog: Add folder, Add scan folder
- [ ] Open in editor, in terminal and in the file manager for real (capture runs only log with `APP_LAUNCH_DRY=1`); with a Flatpak or Snap editor
- [ ] Tray icon and menu; close to tray; export and import file dialogs
- [ ] Clipboard (Copy path) on Wayland; fullscreen; following a live OS light/dark change; keyboard-only use and focus order
- [ ] Hover and glitch motion, and `prefers-reduced-motion`
- [ ] Performance with hundreds of cards (the grid is not virtualised) and a scan of a large folder
- [ ] Install the `.deb` (`pnpm dist`), then deep links (`project-ops://open/projects/<id>`)
- [ ] `pnpm dist:win` on Windows and `pnpm dist:mac` on a Mac, including the launcher entries

## Product ideas left out

- Track a moved or renamed folder (today it shows as missing and a new card appears).
- A "show hidden projects" view; today only the Undo toast or adding the same folder again brings one back.
- Tag counts that say what a click would give. Counts leave out the whole tag group, so with a tag already included the other tags' counts do not show what adding one more would leave.
- Windows launchers: `.cmd` shims (`code.cmd`) need an explicit `cmd.exe /d /s /c` call with safe quoting (see the comment in `electron/features/launch.ts`).
- Run git in repositories with a non-plain config safely, or show last commit and dirty state for them by another route.
- Read the description from `Cargo.toml` or `pyproject.toml` (only `package.json` is read now).
- Auto-update, multiple windows, translations, SQLite, code signing: outlines in `docs/guides/not-built.md`.
