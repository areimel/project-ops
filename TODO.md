# TODO

What is left. Tests and screenshot runs cover the logic and the first paint; the items under "Try by hand" need a person.

## Before publishing

- [ ] Set the real project links: `links.website` (now `https://example.com/`) and the repository URL in `shared/brand.ts`, then the same values in `package.json` (`homepage`, `repository.url`). `tests/brand.test.ts` keeps them in step.
- [ ] Replace the generated placeholder icons in `build/` with real artwork.
- [ ] Harden the packaged app with Electron fuses (`@electron/fuses`): it still accepts `--remote-debugging-port` and similar switches (Electron's default).
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

## Known follow-ups

- A per-card "refresh" control: `projects:refresh` exists and is wired in the hook, but no button uses it.
- Bulk edit of category and tags: a first scan of ~70 projects gives folder-name categories and no tags, and each must be edited one by one.
- A view of hidden (removed) projects; today only the Undo toast or adding the same folder again brings one back.
- Track a moved or renamed folder: today it shows as missing and a new card appears.
- Repositories with submodules (or any non-plain config) get no last-commit or dirty info; show it by another route or run git safely there.
- Windows and macOS launchers are untested (`pnpm dist:win` / `pnpm dist:mac` never run).
- `website/` is still the App Template site (see the rebrand item above).

## Product ideas left out

- Windows launchers: `.cmd` shims (`code.cmd`) need an explicit `cmd.exe /d /s /c` call with safe quoting (see the comment in `electron/features/launch.ts`).
- Read the description from `Cargo.toml` or `pyproject.toml` (only `package.json` is read now).
- Auto-update, multiple windows, translations, SQLite, code signing: outlines in `docs/guides/not-built.md`.
