# Repository guidelines

`CLAUDE.md` is the full guide: layout, how the pieces fit together, the rules, the security model and the gates. Read it first; this file only lists the basics and does not repeat it.

## Setup and checks

Node 24 and the pnpm version pinned in `package.json`. `pnpm install`, then `pnpm dev`.

Before every commit: `pnpm typecheck && pnpm test`, and check the exit status itself (do not pipe it through `tail` or `grep`). Target one test file with `pnpm test tests/store/collection.test.ts`. `pnpm build` runs the type check and both bundles. The `website/` folder has its own checks (`pnpm --dir website check`, `build`, `test:browser`).

## Where things go

- Main process code in `electron/`; the page in `renderer/`; code both sides import in `shared/`. Main never imports from `renderer/`; `shared/` never imports `electron` or React.
- A demo app is `renderer/apps/<id>/` plus one line in `renderer/apps/registry.ts`. Guides for each common change are in `docs/guides/`.
- Brand, IPC channels, commands, collections and colour tokens are each declared in one place; edit that place instead of copying values.
- New IPC channels: declare in `shared/ipc/`, handle and validate every argument in `electron/ipc/`.
- Pure logic goes in a tested module under `tests/`; keep files under about 300 lines; reuse `renderer/components/common/*` and extract a shared piece at the third use.

## Style

Two-space indentation, double quotes, semicolons; PascalCase components, camelCase functions, `use*` hooks. Copy is sentence case. Colours come from the tokens in `renderer/theme/`. No lint or format script is configured. Name tests `tests/**/*.test.ts` (vitest `describe`, `it`, `expect`); they do not start Electron or render the DOM.

## Commits and pull requests

Concise imperative subjects, optionally prefixed with the area (`Main:`, `Store:`, `Shell:`, `Notes:`, `Site:`, `Docs:`); one workstream per commit, each passing the gates. A pull request says the problem, the behaviour now and how it was checked, and includes screenshots for visual changes. The capture harness in `CLAUDE.md` ("Verifying without a person") makes them.
