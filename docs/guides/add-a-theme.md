# Add a theme

A theme is one CSS file that gives 12 colour tokens for light and for dark. The Settings picker, the window background and the contrast tests pick it up from a short list.

Example id: `slate`.

## Files to touch

| File | What |
| --- | --- |
| `renderer/theme/themes/slate.css` | the two colour blocks |
| `renderer/theme/index.css` | `@import "./themes/slate.css";` |
| `shared/theme.ts` | add to `THEMES` and `WINDOW_BG` |

## Steps

1. Copy `renderer/theme/themes/kraft.css` to `slate.css` and change `kraft` to `slate` in both selectors. Keep the selector form exactly (the tests read it): `:root[data-theme="slate"][data-mode="light"], [data-theme="slate"][data-mode="light"] { ... }`, and the same for `dark`.
2. Each block must define these tokens, each as a six-digit hex colour, and nothing else: `--bg --surface --surface-raised --text --text-muted --line --accent --accent-text --accent-ink --danger --danger-ink --success`.
   - `--accent-ink` is text on an accent fill; `--danger-ink` text on a danger fill.
   - `--accent-text` is the accent when used as text or a thin line; make it darker than `--accent` on light themes if needed.
   - `--line` is decoration only. Control borders use `--text-muted`.
3. Import it in `renderer/theme/index.css`.
4. In `shared/theme.ts` add `{ id: "slate", name: "Slate" }` to `THEMES` and `slate: { light: "<--bg light>", dark: "<--bg dark>" }` to `WINDOW_BG`. The window background colour is set by main before the page paints, so it must equal `--bg`; the test compares them.
5. Run `pnpm test`. `tests/theme.test.ts` checks every theme and mode for: the exact token set, `WINDOW_BG` equals `--bg`, text and muted text at least 4.5:1 on `--bg`, `--surface` and `--surface-raised`, ink on accent and danger at least 4.5:1, accent text, danger and success at least 4.5:1 on the surfaces, the accent line and the muted text at least 3:1.
6. Look at it: `pnpm dev`, Settings > Appearance, then check each sheet in light and dark.

Derived colours (hover, selected, scrim, focus) come from these tokens in `renderer/theme/tokens.css`; do not define them in a theme. The user's accent override (Settings) replaces `--accent`, `--accent-ink` and `--accent-text` at runtime on top of any theme.

The website has its own tokens in `website/src/styles/global.css`; a new app theme does not change it.

## Checklist

- [ ] `pnpm test` exit 0
- [ ] the swatch appears in Settings and applies in light, dark and system mode
- [ ] no flash of the wrong colour when the window opens
