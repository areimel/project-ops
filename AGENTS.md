# Repository guidelines

`CLAUDE.md` is the full guide: layout, how the pieces fit together, the rules, the security model and the gates. Read it first; this file only lists the basics. For the projects feature (record fields, scan markers, launchers, the git allowlist) see `docs/guides/projects.md`.

## Setup and checks

Node 24 and the pnpm version pinned in `package.json`. `pnpm install`, then `pnpm dev`.

Before every commit: `pnpm typecheck && pnpm test`, and check the exit status itself (do not pipe it through `tail` or `grep`). Target one test file with `pnpm test tests/projects/heal.test.ts`. `pnpm build` runs the type check and both bundles. The `website/` folder is a separate project with its own checks (`pnpm --dir website check`, `build`, `test:browser`).

## Where things go

- Main process code in `electron/`; the page in `renderer/`; code both sides import in `shared/`. Main never imports from `renderer/`; `shared/` never imports `electron` or React.
- The page never sees an absolute path: stored records live in main (`shared/projects/record.ts`), the page gets `ProjectView`s and sends record ids and healed patches. Never add a channel that takes a path, a URL or a command.
- Brand, IPC channels, commands, launchers and colour tokens are each declared in one place; edit that place instead of copying values.
- The app is `renderer/apps/projects/`, listed in `renderer/apps/registry.ts`. Guides for common changes are in `docs/guides/`.
- Pure logic goes in a tested module under `tests/`; keep files under about 300 lines; reuse `renderer/components/common/*` and extract a shared piece at the third use.

## Style

Two-space indentation, double quotes, semicolons; PascalCase components, camelCase functions, `use*` hooks. Copy is sentence case. Colours come from the tokens in `renderer/theme/`. No lint or format script is configured. Name tests `tests/**/*.test.ts` (vitest `describe`, `it`, `expect`); they do not start Electron or render the DOM.

## Commits and pull requests

Concise imperative subjects prefixed with the area (`Main:`, `Store:`, `Shell:`, `Theme:`, `Components:`, `Settings:`, `Projects:`, `Docs:`, `Site:`); one workstream per commit, each passing the gates. A pull request says the problem, the behaviour now and how it was checked, and includes screenshots for visual changes. The capture harness in `CLAUDE.md` ("Verifying without a person") makes them.
