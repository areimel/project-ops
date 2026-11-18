# Website

A static Astro site that describes the desktop app in this repository. It is a template: rebrand it by editing the files in `src/config/`, not the pages.

## Rebrand

Every product fact, deploy setting and piece of copy lives in `src/config/`. Pages and components read from there, so most rebrands touch only these files.

| File | Holds |
| --- | --- |
| `src/config/deploy.ts` | Default origin (`siteUrl`) and base path (`siteBase`). `SITE_URL` and `SITE_BASE` override them. |
| `src/config/product.ts` | Name, short description, description, package name, repository and release URLs, licence, operating system, author. Start here. |
| `src/config/site.ts` | URL helpers (`url()`, `absoluteUrl()`), the install command, main navigation, and the theme storage key. Re-exports `product`. |
| `src/config/content.ts` | Demo list and sheet numbers, shared feature cards, screenshot slots (`src` and `alt`), footer text, page meta defaults. |
| `src/config/forms.ts` | Form endpoint, timeout, email subjects, consent field name, and all signup and contact labels and messages. |
| `src/config/pages/*.ts` | Page copy for home, download, docs, contact and the 404 page. One file per page. |

Other assets to replace:

- `public/favicon.svg`: the browser tab icon.
- `public/social.svg` and `public/social.png`: the link preview image. Edit the SVG, then render the PNG with the command in `public/images/README.md`.
- Screenshots: `public/images/`. Each slot in `src/config/content.ts` points at `images/placeholder.svg` until a real capture is added. `public/images/README.md` explains how to capture and convert them.
- `public/install.sh` is not hand-edited. It is generated from `installCommand` in `src/config/site.ts` by `src/pages/install.sh.ts`, using `src/lib/installScript.ts`. Change the release file name or repository in `src/config/product.ts`, and the script follows.

## Local development

Use Node 24 and pnpm 11.22.0. From the repository root:

```sh
pnpm --dir website install --frozen-lockfile
cp website/.env.example website/.env
pnpm --dir website dev --background
```

Open **http://localhost:4321/electron-app-template/**. The path is `<SITE_BASE>/` and comes from `src/config/deploy.ts` unless you override it. Manage the background server with `pnpm --dir website dev status`, `dev logs` or `dev stop`. Restart it after changing `website/.env`.

This folder has its own pnpm workspace and lockfile. Desktop dependencies are separate, so install and run website commands with `pnpm --dir website`.

Check, build and preview:

```sh
pnpm --dir website check
pnpm --dir website build
pnpm --dir website preview
```

The static output is `website/dist`. No application server is required.

## Theme

The colours come from the Blueprint tokens in `src/styles/global.css`. Light and dark variants follow the system preference by default. The header toggle overrides that choice and stores it in `localStorage` under the key in `themeStorageKey` (`src/config/site.ts`). Nothing else is stored in the browser.

## Web3Forms setup

The signup and contact forms submit through [Web3Forms](https://web3forms.com/). Create an access key for the inbox that should receive submissions. Set it as `PUBLIC_WEB3FORMS_ACCESS_KEY` in `website/.env` for local work, or in the build environment. Rebuild after changing it.

- The key is public by design. It is embedded in the built HTML. Never use a private API secret.
- No key is committed to this repository, and `website/.env` is gitignored.
- With no key, both forms are disabled and show a visible message. This path is tested.
- Signup requires explicit consent to release updates. A contact inquiry never subscribes the sender.
- Both kinds of submission go to the configured inbox under different subjects (`src/config/forms.ts`). Signup is email capture, not a mailing-list integration, so handle launch messages and removal requests yourself.
- Restrict allowed domains in Web3Forms if your account supports it.

Real delivery needs your key and inbox to check. Tests mock every submission.

## GitHub Pages

The workflow `.github/workflows/website-pages.yml`, named **Deploy website**, runs only when dispatched manually. Local development and pushes do not deploy anything.

1. In repository Settings, Pages, choose **GitHub Actions** as the source.
2. Add the Actions secret `PUBLIC_WEB3FORMS_ACCESS_KEY`. It is the public key for the inbox.
3. Optionally set the Actions variables `SITE_URL` and `SITE_BASE`. When they are empty, the workflow builds with the defaults in `src/config/deploy.ts`. Set them only when the destination differs from those defaults.
4. Run **Deploy website** from the Actions tab.

For a custom domain, set `SITE_URL` to its HTTPS origin and `SITE_BASE` to `/`, then configure the domain in Pages settings. `SITE_URL` is the origin only. Keep any project path in `SITE_BASE`.

The workflow installs with the lockfile, runs `astro check`, builds, and deploys `website/dist`. Links, assets, canonical URLs, the install script and the social image all respect the configured base.

## Browser verification

```sh
pnpm --dir website test:browser
```

This builds and tests two production variants with Playwright: one with a dummy Web3Forms key and mocked responses, then one without a key. It starts and stops its own preview server on port 4321, so stop any running website dev server first, or pick another port with `PREVIEW_PORT=4410 pnpm --dir website test:browser`. The final build is left without the dummy key. No test submission reaches Web3Forms.

The suite uses `/usr/bin/google-chrome` when it exists. Otherwise run `pnpm --dir website exec playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a Chrome or Chromium binary. The tests cover desktop and mobile layouts, links, the command copy button, consent, submission states and the unavailable-forms path.

## Editing

- Shared components live in `src/components/` and the layout in `src/layouts/`. Reuse them rather than repeating their markup.
- Colours, type and spacing come from the tokens in `src/styles/global.css`. Do not add raw colour values to pages or components.
- Copy and product facts go in `src/config/`, not in page files.
- Keep files under roughly 300 lines. Split by responsibility when they grow.
- The site's starter manual is `src/content/guide.md`.
