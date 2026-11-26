# Styleguide screen and UI consolidation: design

Approved 2026-11-24. The build plan and the design in one document; where the build differs, the code wins.

## Context

Project Ops has 27 shared components and about 420 lines of shared CSS, but no place to see them together, and the app screens have drifted: two edit dialogs copy the same form code, the card and dashboard tile copy a footer and disagree on icon order, tags are sentence case on cards and upper case in the dossier, and `Toolbar` sits unused beside three hand-made toolbars. Agents building new screens have nothing dependable to copy from.

This work adds a **Styleguide** screen (the app's parts catalogue) and uses it to drive a consolidation pass, so the UI is more consistent and each rule lives in one place.

Decisions the owner made:

| Question | Decision |
| --- | --- |
| Where it lives | Dev and unpackaged builds only; absent from the `.deb` |
| Coverage | Foundations (tokens, type, spacing, label, icons), every common component, composed patterns |
| Structure | Typed catalogue, **one entry file per component**, one generic sheet renderer, a coverage test |
| Specimens | State matrix (all variants at once), with a Dark / Light / Both toggle |
| Unused `Panel`, `Slider`, `SplitPane` | Keep, catalogue as "not in use yet" |
| Cleanup | All ten consolidations, each its own commit with before/after captures |
| Look | Kojima's spec-plate vocabulary from `docs/design-examples/` (hazard band, serial, barcode, stamp), reusing `DossierGraphics` |

Honest expectation: the consolidations are roughly line-neutral. The gain is one definition per pattern, not a shorter codebase. Two shared components are added (`FormDialog`, `SectionHead`), so the catalogue ends at 29.

## Approaches considered

- **A. Typed catalogue, entries grouped in ~8 family files.** Fewer files; my recommendation.
- **B. Hand-written JSX sections.** Least code, but no enforced coverage and loose reference for agents.
- **C. Typed catalogue, one file per component (chosen).** Easiest lookup ("read one file for Button") and conflict-free parallel authoring; costs ~44 small files.

## Part 1: the dev-only switch

Every consumer (title bar switch, Go menu, Ctrl/Cmd+3, palette, deep link) derives from `APPS`; main has no app list, so nothing in `electron/` changes.

- `vite.config.ts`: `defineConfig(({ mode }) => ...)`, add `__STYLEGUIDE__: JSON.stringify(mode !== "release")` beside `__APP_VERSION__`; declare it where `__APP_VERSION__` is declared.
- `package.json`: new `build:release` (typecheck, `vite build --mode release`, `build:electron`, then `node scripts/check-release.mjs`); `dist`, `dist:win`, `dist:mac` use it. `pnpm build` and the capture recipe keep the screen.
- `scripts/check-release.mjs` (new): fails if anything in `dist-renderer` contains `StyleguideApp` or `styleguide-` (tree-shaking is checked, not assumed).
- `renderer/apps/registry.ts`: export `BASE_APPS = [dashboard, projects]`, `DEV_APPS`, and `APPS = __STYLEGUIDE__ ? [...BASE_APPS, ...DEV_APPS] : BASE_APPS` (dev apps last, so Ctrl+1/2 never move).
- `tests/registry.test.ts`: assert `BASE_APPS` and `DEV_APPS` ids separately and `APPS` as their conditional join.

## Part 2: the styleguide app (`renderer/apps/styleguide/`)

Entry contract (`types.ts`); every entry file ends `export const entry = { ... } satisfies CatalogueEntry;`

```ts
type Family = "foundations" | "actions" | "inputs" | "display" | "feedback" | "overlays" | "layout" | "patterns";
interface Specimen { label: string; render(): ReactNode; width?: number; minHeight?: number; wide?: boolean; notInUse?: boolean; }
interface CatalogueEntry {
  id: string; title: string; family: Family; source: string; exports?: string[];
  purpose: string; useFor: string[]; notFor: string[]; snippet: string;
  specimens: Specimen[]; status?: "not-in-use"; notes?: string[];
}
```

| File | Role |
| --- | --- |
| `index.ts` | `AppDefinition`; `component` guarded by `__STYLEGUIDE__` so the chunk drops from release builds |
| `StyleguideApp.tsx` | `app-root styleguide`: plate header, index rail, scroll area; holds the mode choice; scrolls to `route.recordId` |
| `catalogue.ts` | `import.meta.glob("./entries/**/*.tsx", { eager: true })` then `collectEntries` (no shared index file to edit per entry) |
| `PlateHeader.tsx` | Reuses `HazardBand`, `Barcode`, `Stamp`, `RegMarks` from `apps/projects/dossier/DossierGraphics.tsx` |
| `IndexRail.tsx`, `useScrollSpy.ts` | Sticky nav grouped by family; instant `scrollIntoView`; `aria-current` from an IntersectionObserver |
| `Sheet.tsx` | The one renderer: title, source path, purpose, use for / not for, status stamp, ruled specimen grid, snippet with copy, "Reset specimens" |
| `SpecimenFrame.tsx` | One frame per mode; calls the existing `applyTheme` (`renderer/theme/useTheme.ts`) on the frame so the owner's accent override survives nested `data-mode`; `position: relative; contain: layout` |
| `Live.tsx` | `<Live initial>{(v, set) => ...}</Live>`: the only place a specimen holds state |
| `fixtures.ts` | `fixtureProject()` and named `ProjectView` fixtures (pinned, dirty, no git, archived, missing), no-op actions, link views; patterns render from props, no IPC |
| `styleguideModel.ts` | Pure: `FAMILIES`, `collectEntries` (id shape, uniqueness, non-empty specimens, order), `railGroups`, `anchorId`, `framesFor`, `activeEntry`, `contrastGrade`, `contrastPairs` (uses `renderer/theme/color.ts`) |
| `styleguide.css`, `styleguide-sheet.css` | `styleguide-` classes, tokens only |
| `entries/foundations/` | `colour`, `type`, `spacing`, `label`, `icons` |
| `entries/components/<Name>.tsx` | One per file in `components/common/` (27, then `FormDialog` and `SectionHead`) |
| `entries/patterns/` | `project-card`, `dashboard-tile`, `trait-rows`, `dossier-cells`, `dossier-plate`, `filter-chips`, `dialog-form`, `section-heads`, `toolbars`, `resource-links` |

Supporting changes:

- `renderer/theme/tokenList.ts` (new): exported token names; `tests/theme.test.ts` imports it instead of its private list, and a new check fails when `tokens.css` has a token the list lacks. Colour swatches read `getComputedStyle` inside their frame (as `AppearanceSection.tsx` does); contrast ratios for the 12 base tokens.
- Small additions so overlays can be shown in place; no existing caller changes behaviour: `Dialog`/`ConfirmDialog` `inline` (no backdrop, no focus move or trap); `Dropdown`, `Combobox`, `TagInput` `defaultOpen`; `ToastHost` `inline`; `Kbd` `mac`; `ICON_NAMES` export from `Icon.tsx`.

Tests: `tests/apps/styleguideModel.test.ts`; `tests/styleguideCoverage.test.ts` (reads the folders with `fs`: every `components/common/*.tsx` has `entries/components/<Name>.tsx` naming it as `source`, no orphan entries, every selector in the styleguide CSS starts `.styleguide-`, no raw hex).

Limits to state on the page and in the guide: hover, focus and pressed states are live (point or Tab), not frozen; an outside click closes a pre-opened menu ("Reset specimens" reopens it); `project-ops://open/styleguide/<id>` cannot deep-link to a sheet because the parser only accepts 16-hex record ids (in-app navigation works; not relaxing the parser).

## Part 3: the ten consolidations

| # | Change | Shared API | Visible change |
| --- | --- | --- | --- |
| 1 | Dead names: `.checkbox`, class names with no CSS (`projects-form-desc`, `projects-form-link`, `title-block-view`), `--content-max` | none | none |
| 2 | One scroll pane for grid and dossier | `.scroll-area` in `styles/layout.css` | none |
| 3 | One grid for cards, tiles, links | `.card-grid` with `--card-min`, `--card-gap` | none |
| 4 | Field errors and form grid | `error?: string` on `TextField`, `TextArea`, `Combobox`, `TagInput`; `FieldLabel`, `FieldError` inside `Field.tsx`; `.form-grid`, `.form-wide` | none intended |
| 5 | `FormDialog` for `ProjectDialog` and `LinkDialog` | `FormDialog({ title, saveLabel, invalid, patch, onSave, onRemove?, onClose, inline? })`, owns `saving` and the footer | none |
| 6 | Project parts: `apps/projects/ProjectParts.tsx` | `OpenActions`, `ProjectLinks`, `GitRows`, `DirtyMark`, `NoneText` | card footer becomes editor, terminal, folder (matches tile and dossier) |
| 7 | Tag look | `Badge variant="tag"`, `.chip-row` | dossier and edit-dialog tags become sentence case |
| 8 | Toolbar and button rows | `Toolbar` gains `inset="page"`; `.btn-row` | a few pixels at most |
| 9 | Section heads and hints | `SectionHead({ title, level?, end? })`; `.hint`, `.text-muted` | dossier muted text line-height 1.6 to 1.5 |
| 10 | Tones | `.tone-*` setting `--tone` and `--tone-text` for status, toasts, title block, stamp; `StatusDot hideLabel`; `--select-bar` | list-row selected bar 3px to 2px |
| 11 | Settings | `SettingsSection({ id, title, children })`; `settings-` prefix on `about-*`, `accent-*` | none |

(The audit's "dead code" and "form kit" items are split here, hence eleven rows.) Left alone as only coincidentally alike: Card vs Mosaic, `.projects-link` vs `.btn-link`, `.about-facts` vs `.kv-row`, `.projects-cat` vs `ListRow`, `.settings-actions`, the card and tile bodies. Unused tokens (`--grid`, `--r-pill`, `--z-base`, `--z-chrome`, `--fw-bold`) are shown as "not in use" on the foundations sheet and listed in `TODO.md`, not deleted.

## Build order, commits and the team

Before step 1: commit the design as `docs/superpowers/specs/2026-11-24-styleguide-design.md` (this plan in spec form, including the approaches).

```
S0 capture seed script ─┐
S1 design doc → S2 build flag → S3 inline/defaultOpen props → S4 token list → S5 styleguide shell + foundations
                                  │                                              └→ Lane A: entry batches A1–A5 in parallel
                                  ├→ Lane B: consolidations B1…B10, strictly serial (projects.css is touched by 8 of them)
                                  └→ Lane C: settings (touches only renderer/settings/)
Lane B done → A6 (entries for components the consolidations changed or added) → A7 coverage test → D1 docs
```

Commits (about 22, each passing `pnpm typecheck && pnpm test`):

1. `Scripts: seed profile for capture runs`
2. `Docs: styleguide and UI consolidation design`
3. `Shell: build flag that keeps dev-only screens out of release builds`
4. `Components: show dialogs, toasts and open menus in place`
5. `Theme: export the token list and test tokens.css against it`
6. `Styleguide: catalogue screen, sheet renderer and foundations`
7. to 11. `Styleguide: entries for ...` (five batches)
12. to 21. one commit per consolidation (areas `Components:`, `Projects:`, `Theme:`, `Settings:`)
22. `Styleguide: entries for fields, badge, status, toast, toolbar, form dialog and section head`
23. `Styleguide: coverage test for common components`
24. `Docs: styleguide guide, CLAUDE.md, add-an-app, changelog, todo`

Subagents (about 14, within the limit of 20). I orchestrate, review every diff, run the gates and make every commit myself.

| Agent | Model | Work |
| --- | --- | --- |
| Foundation builder | Sonnet | S0, S2 to S5 in order (the contract everything else depends on) |
| Consolidation lead | Opus | Owns Lane B's order and reviews each step's before/after captures |
| Consolidation builders ×2 | Sonnet | B1 to B10, handing off serially (never two at once) |
| Settings builder | Haiku | Lane C |
| Entry writers ×2 | Haiku | A1 buttons, keys, spinner, icons; A2 switch, segmented, slider, split pane, panel |
| Entry writers ×3 | Sonnet | A3 dropdown, suggestion list, dialog; A4 card, key value, list, mosaic, empty state; A5 the ten patterns |
| Entry writer | Sonnet | A6 after Lane B |
| Capture runner | Haiku | Before/after PNGs per consolidation into the scratchpad |
| Design reviewer | Opus | Critiques styleguide captures against the design examples and the frontend-design principles; one round of fixes |
| Docs writer | Sonnet | D1 |
| Final reviewer | Opus | Whole-branch code review before the summary |

Lane A agents write only new files under `entries/`, so they cannot conflict. Lane B never runs two agents at once.

## Docs to update (commit 24)

- `docs/guides/styleguide.md` (new): where entries live, the interface, how to add one, the coverage test, capture recipe.
- `CLAUDE.md`: `BASE_APPS`/`DEV_APPS` and `__STYLEGUIDE__`; `build:release`; layout (styleguide folder, `FormDialog`, `SectionHead`, `ProjectParts`, `tokenList.ts`, new utilities); tone scheme; rule "read `renderer/apps/styleguide/entries/` first; a new common component needs an entry"; tags use `variant="tag"`; seed script and styleguide capture; commit areas `Styleguide:`, `Scripts:`.
- `docs/guides/add-an-app.md`, `docs/guides/projects.md` (renamed classes), `AGENTS.md`, `CHANGELOG.md`, `TODO.md` (live-only hover states, unused tokens, extract `DossierGraphics` at a third use).

## Verification

- `pnpm typecheck && pnpm test` (exit status checked directly) before every commit.
- Styleguide: build (`pnpm exec vite build --configLoader runner && pnpm build:electron`), seed a throwaway profile with the seed script, capture with `APP_CAPTURE` and an `APP_CAPTURE_EVAL` that navigates to the styleguide, scrolls to a sheet and picks a mode. Capture the top, three or four sheets, and "Both" mode; read each PNG.
- Each consolidation: before capture on the parent commit, after capture on the step, same seed and size, for the screens that step touches (dashboard, grid, dossier, edit dialog, link dialog, settings; light and dark for the tone step). No-visible-change steps must match; the three intended changes must show only what the table says.
- Release: run `pnpm build:release` once and confirm `scripts/check-release.mjs` passes (no styleguide code in `dist-renderer`); a capture of that build shows two title bar buttons.
- Not verifiable here, to be reported as such: the installed `.deb`, and hover/focus appearance.
