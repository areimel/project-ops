# Add another app (a new screen)

Project Ops has two apps, `dashboard` (the home screen) and `projects` (the grid), plus a dev-only screen, `styleguide` (`docs/guides/styleguide.md`). An app is a folder in `renderer/apps/` plus one registry entry; the title bar, the command palette, the native menu and the shortcut help are generated from it. Every app gets a button in the title bar's switch, a Go menu entry and a `Ctrl/Cmd+1..9` shortcut (`goCommands` in `shared/commands.ts`), in registry order. There is no home index and no rail: the first app in `APPS` (that is, in `BASE_APPS`) is where the wordmark and `project-ops://home` go. The title bar has room for a few names only, so a fourth or fifth app means rethinking that switch.

The example id is `habits`. It must match `^[a-z][a-z0-9-]{0,31}$` and is also the prefix of command ids (`habits.new`) and CSS classes (`.habits-`).

## Files to touch

| File | What |
| --- | --- |
| `renderer/apps/habits/index.ts` | the `AppDefinition` |
| `renderer/apps/habits/HabitsApp.tsx` | the screen; default export |
| `renderer/apps/habits/habits.css` | styles, classes prefixed `habits-` |
| `renderer/apps/habits/habitsModel.ts` | pure logic |
| `tests/apps/habitsModel.test.ts` | tests for the model |
| `renderer/components/common/Icon.tsx` | one path in `PATHS` for the app icon |
| `renderer/apps/registry.ts` | one import and one array entry, in `BASE_APPS` (or `DEV_APPS`, see below) |
| `tests/registry.test.ts` | the first test expects `BASE_APPS` ids to equal `["dashboard", "projects"]` exactly, the second `DEV_APPS` to equal `["styleguide"]`; update the one you changed |

## Steps

1. **Definition.** Copy `renderer/apps/projects/index.ts`: `id`, `name`, `icon` (a key of `PATHS` in `Icon.tsx`), `summary`, `component: lazy(() => import("./HabitsApp"))`, optional `commands`.
2. **Screen.** `HabitsApp.tsx` default-exports a component whose root is `<div className="app-root habits">`. Use `renderer/components/common/*` before writing markup. Import `./habits.css` and use only tokens.
3. **Shell hooks** from `renderer/shell/ShellContext`: `useShell()` (`toast`, `confirm`, `navigate`, `route`; `route.recordId` carries the id from `project-ops://open/habits/<recordId>`), `useTitleInfo({ count })`, `useCommandHandlers({ "habits.new": fn })` (a command without a handler does nothing and is hidden from the palette), `useNavigationGuard(message | null)` (leaving or closing asks first), `useHint()`.
4. **Commands.** See `add-a-command.md`. Ids start with `habits.`; keys and accelerators must not repeat any in the shell or the same app (`tests/registry.test.ts`). At most 30 commands per app and 20 apps.
5. **Registry.** In `renderer/apps/registry.ts` import it and append it to `BASE_APPS`. `APPS` is `BASE_APPS` plus `DEV_APPS` (when `__STYLEGUIDE__` is on), and its order is the `Ctrl/Cmd+1..9` order; dev apps come last so the shortcuts of the real apps never move.
6. **Data and main work.** Records the app stores: `add-a-stored-collection.md`. Work only main can do: `add-an-ipc-channel.md`.

## Make an app dev-only

Put it in `DEV_APPS` instead of `BASE_APPS`. It then appears only when `__STYLEGUIDE__` is true (everything except `--mode release`, so `pnpm build:release` and the `dist*` scripts leave it out). To let the bundler drop its code, follow `renderer/apps/styleguide/index.ts`: wrap the dynamic import in the flag, `lazy(() => (__STYLEGUIDE__ ? import("./HabitsApp") : Promise.reject(new Error("Not in this build"))))`. `scripts/check-release.mjs` looks for the strings `StyleguideApp` and `styleguide-` in `dist-renderer`; add the new app's names to its `NEEDLES` so a leak fails the release build. Update `tests/registry.test.ts` (the `DEV_APPS` expectation).

## Checklist

- [ ] `pnpm typecheck && pnpm test` exit 0
- [ ] `pnpm dev`: the app opens from the palette (`Ctrl/Cmd+K`) and from `project-ops://open/habits`
- [ ] empty, loading and error states are drawn
- [ ] works in light and dark (Settings > Appearance)
