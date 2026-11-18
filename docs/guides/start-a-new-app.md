# Start a new app from this template

Goal: a copy of this repository that is your app, with your name, your icons and only the demos you want, running on your machine.

Terms used here: the **main process** (`electron/`) is the Node side that can use files, the network and the OS. The **renderer** (`renderer/`) is the sandboxed web page. A **sheet** is one screen in the app; each demo is one sheet.

## 1. Clone and run once

```bash
git clone https://github.com/areimel/electron-app-template.git my-app
cd my-app
pnpm install
pnpm dev
```

Needs Node 24 and pnpm 11 (`packageManager` in `package.json` pins the exact pnpm version). `pnpm dev` starts Vite on port 5173 and stops with a message if that port is taken; set `APP_DEV_PORT` to use another. On Linux it adds `--no-sandbox` for you when the downloaded `chrome-sandbox` is not setuid root; that is a dev-only workaround.

Confirm the starting point is green before you change anything:

```bash
pnpm typecheck && pnpm test
```

Then detach it from the template's history: delete `.git`, run `git init`, and set your own remote.

## 2. Rebrand

One source file, three places that must agree with it. `tests/brand.test.ts` fails when they drift, so run `pnpm test` after each step.

1. Edit `shared/brand.ts`: `name`, `tagline`, `packageName`, `appId`, `scheme` (deep links, `my-app://open/notes`), `mediaScheme`, `author`, `copyright`, `links`, `defaultTheme`, `defaultMode`. `envPrefix` is the prefix of the dev variables (`APP_CAPTURE`, `APP_LOG_LEVEL`); change it if you like, and the docs that mention `APP_` with it.
2. Edit `package.json` to match: `name` = `packageName`, `productName` = `name`, `description` = `tagline`, `author`, `homepage` = `links.website`, `repository.url` = `links.source` (plus `.git`), `desktopName` = `<packageName>.desktop`.
3. Edit `electron-builder.yml` to match: `appId`, `productName`, `copyright`, the `protocols` scheme and the `x-scheme-handler/<scheme>` mime type, `linux.executableName` and the `artifactName` prefix (both = `packageName`), and `linux.maintainer`. `protocols.name` is not tested; set it to the product name.
4. Replace the icons: put your artwork in `build/icons/<N>x<N>.png` (16 to 512), `build/icon.png` (used for Windows and macOS) and `build/tray.png`. Or edit the colours in `scripts/make-icons.mjs` and run `node scripts/make-icons.mjs` (needs ImageMagick's `convert`).
5. Set the real links in `shared/brand.ts` (`website` is a placeholder, the repository URL is a guess) and the same URLs in `package.json`.
6. Replace `LICENSE`, `README.md`, `CHANGELOG.md` (keep its format, see `README.md`), `THIRD_PARTY_NOTICES.md` and the names in `AGENTS.md` and `CLAUDE.md`.
7. The website has its own config: `website/src/config/product.ts`, `deploy.ts` and the rest (see `website/README.md`).

Changing `scheme` also changes the scheme the packaged page is served from (`<scheme>-app`, in `shared/csp.ts`). Nothing else needs editing for that.

## 3. Cut the demos you do not need

Follow `remove-a-demo.md` for each one. Do it one demo at a time and run `pnpm typecheck && pnpm test` after each, because the list of demos is also asserted in `tests/registry.test.ts`. Keep what you will reuse: the shell, Settings, themes, the collection store, `useCollection`, IPC and the common components are not demos.

## 4. First app of your own

`add-an-app.md` (a new sheet), then `add-a-stored-collection.md` if it keeps records and `add-an-ipc-channel.md` if it needs the main process.

## 5. Check and ship

```bash
pnpm typecheck && pnpm test
pnpm build
pnpm dist        # .deb in release/ (Linux). pnpm dist:win and pnpm dist:mac are configured but have never been run.
```

Read "Known gaps" in `README.md` before you trust the installed build: tray, notifications, file dialogs, deep links on an installed copy and the Windows and macOS builds have not been tried by a person.
