# The styleguide: task guide

The styleguide is a third screen, `renderer/apps/styleguide/`, that shows every token, every component in `renderer/components/common/` and the main patterns (card, tile, dossier cells, form dialog) in dark and light, with what each is for and what it is not for. It exists so a developer or an AI agent builds UI from the parts that already exist instead of writing new markup. The design is in `docs/superpowers/specs/2026-11-24-styleguide-design.md`.

It is dev-only. `__STYLEGUIDE__` (set in `vite.config.ts`, false only for `--mode release`) removes it from release builds: `pnpm build:release` (which `pnpm dist`, `dist:win` and `dist:mac` run) builds with the flag off, and `scripts/check-release.mjs` fails the build if `dist-renderer` still holds styleguide code.

Open it with the "Styleguide" button in the title bar, `Ctrl/Cmd+3`, or "Go to Styleguide" in the command palette. In `pnpm dev` and plain `pnpm build` it is always there.

## The rule

Before building or changing UI, read the matching entry in `renderer/apps/styleguide/entries/`: its "Use for" and "Not for" lists, its snippet and its notes. A new component in `renderer/components/common/` needs an entry; `tests/styleguideCoverage.test.ts` fails when a common component has no sheet.

## Where things are

| Path | What |
| --- | --- |
| `entries/foundations/` | colour, type, spacing, label look, icons (5 sheets) |
| `entries/components/` | one sheet per file in `renderer/components/common/*.tsx`, named after the file |
| `entries/patterns/` | compositions that are not a common component (10 sheets: project card, dashboard tile, dossier plate and cells, trait rows, filter chips, resource links, section heads, toolbars, dialog form) |
| `types.ts` | the `CatalogueEntry` and `Specimen` contract |
| `catalogue.ts` | `import.meta.glob` over `entries/**/*.tsx`; adding a file is all the registration there is |
| `styleguideModel.ts` | pure: entry checks, family order, index rail, mode frames, scroll spy, contrast table (`tests/apps/styleguideModel.test.ts`) |
| `Sheet.tsx`, `PlateHeader.tsx`, `IndexRail.tsx`, `SpecimenFrame.tsx`, `SpecimenBoundary.tsx`, `FoundationParts.tsx` | the one renderer for every sheet; no entry has its own layout |
| `Live.tsx` | the one place a specimen holds state |
| `fixtures.ts` | fixed project views and resource links for the pattern entries |
| `styleguide.css`, `styleguide-sheet.css` | styles, every class starts with `styleguide-` (tested) |

`SpecimenFrame.tsx` renders each specimen set in a frame with its own `data-mode` and `applyTheme`, so the Dark, Light and Both switch in the index rail (it starts at the current mode) shows the real tokens of each mode. `SpecimenBoundary.tsx` catches a specimen that throws so one broken specimen does not blank the sheet.

## The entry contract

Copied from `renderer/apps/styleguide/types.ts`:

```ts
export type Family = "foundations" | "actions" | "inputs" | "display" | "feedback" | "overlays" | "layout" | "patterns";

export interface Specimen {
  label: string;
  /** Called as a plain function by a wrapper component: no hooks in it. Stateful specimens use <Live>. */
  render(): ReactNode;
  /** Fixed box width in px (for container-query demos). */
  width?: number;
  /** Reserved height in px (room for an open menu). */
  minHeight?: number;
  /** Spans the whole row. */
  wide?: boolean;
  notInUse?: boolean;
}

export interface CatalogueEntry {
  id: string;                 // ^[a-z][a-z0-9-]*$, unique
  title: string;
  family: Family;
  source: string;             // path of the source file
  exports?: string[];
  purpose: string;
  useFor: string[];
  notFor: string[];
  snippet: string;
  specimens: Specimen[];
  status?: "not-in-use";
  notes?: string[];
}
```

- `label`: the caption under the specimen; unique within the entry (it is the React key).
- `render`: returns the specimen. No hooks; wrap state in `<Live>`.
- `width`: a fixed box in px. Over 320 the specimen takes the whole row, as with `wide`.
- `minHeight`: reserved height so an open menu does not overlap the next specimen.
- `wide`: the specimen takes the whole row.
- `notInUse`: tags this one specimen "Not in use yet" (a variant or prop no screen uses).
- `id`: also the page anchor, `styleguide-<id>`.
- `title`: the sheet heading and its name in the index rail.
- `family`: the group in the rail; see "Families" below.
- `source`: the repo-relative path of the file the sheet documents.
- `exports`: the names a reader imports from it.
- `purpose`: one or two sentences on what the part is.
- `useFor`, `notFor`: when to pick it and what to pick instead (name the other part).
- `snippet`: copy-ready code. One click on it selects it all (the page cannot write the clipboard: the session grants no such permission).
- `specimens`: at least one; the live examples.
- `status`: `"not-in-use"` stamps the whole sheet when no screen uses the part yet.
- `notes`: extra facts and limits, shown under the specimens.

## Add a sheet

1. **File.** A new common component `Foo.tsx` gets `entries/components/Foo.tsx` (the coverage test compares the two folders by file name). A pattern gets `entries/patterns/<kebab-name>.tsx`; a foundation goes in `entries/foundations/`. Copy a neighbour, for example `entries/components/Toolbar.tsx`.
2. **Shape.** `export const entry = { ... } satisfies CatalogueEntry;`. The test checks for exactly `export const entry = ` and `satisfies CatalogueEntry;`.
3. **Source.** `source: "renderer/components/common/Foo.tsx"` for a component, written exactly like that: the test looks for that string and that the file exists. A pattern points at the app file it documents.
4. **Family.** One of the `Family` values. The sheet's place in the rail follows from it.
5. **Text.** `purpose`, `useFor` and `notFor` say what a developer needs to choose between parts; name the alternative in `notFor`. `snippet` is the shortest real use, copied from the app where one exists.
6. **Specimens.** One per variant, size and state a reader needs. Rules:
   - `render()` is a plain function: no hooks. Anything with state goes in `<Live initial={...}>{(value, set) => ...}</Live>`.
   - No hard-coded DOM ids or `htmlFor` targets: Both mode renders every specimen twice, so a fixed id would repeat.
   - A specimen wider than a grid cell sets `wide: true` or `width` over 320 and takes the row. In Both mode a sheet with such a specimen stacks Dark over Light instead of side by side.
   - A specimen with an open menu sets `minHeight`.
   - A variant or prop that no screen uses gets `notInUse: true` on that specimen; a whole component no screen uses sets `status: "not-in-use"` on the entry (Panel, Slider and SplitPane do).
   - Layout helpers for specimens: `styleguide-row` (wrapping row), `styleguide-stack` (column), `styleguide-inline`, `styleguide-muted`, `styleguide-small`. They live in `styleguide-sheet.css`.
7. **No helper files.** Everything under `entries/` must be an entry; the coverage test fails on any other `.tsx` there. Shared specimen data goes in `fixtures.ts`, shared pieces next to it (`FoundationParts.tsx`).
8. **Check.** `pnpm typecheck && pnpm test`, then look at the sheet in both modes (see "Capture a sheet").

Entry ids are unique across all folders and match `^[a-z][a-z0-9-]*$`; `collectEntries` in `styleguideModel.ts` throws, naming the file, when an entry has no export, a bad or repeated id, an unknown family or no specimens.

## Show overlays in place

A dialog, a menu or a toast normally covers the page. The common components take a prop that draws them where they sit:

- `inline` on `Dialog`, `ConfirmDialog`, `ToastHost`, `FormDialog`, `ProjectDialog` and `LinkDialog`: no backdrop, no focus move or trap, and nothing closes it. Never pass it in a screen.
- `defaultOpen` on `Dropdown`, `Combobox` and `TagInput`: the menu starts open. A click outside closes it; the sheet's "Reset specimens" button reopens every specimen. Give such a specimen `minHeight` so the menu has room.
- `mac` on `Kbd` shows the macOS key symbols whatever the platform.

## Patterns and fixtures

A pattern entry renders an app's component from props, with no IPC. `fixtures.ts` has `fixtureProject()` and the named `PROJECTS` (pinned, dirty, no git, paused, archived, missing, manual), `RESOURCE_LINKS`, `NOOP_CARD_ACTIONS` and `NOOP_TILE_ACTIONS`, and a fixed `FIXTURE_NOW` so relative times ("2 days ago") read the same on every visit. A pattern that needs a part of an app must import it from that app's files, so a part used by a pattern has to be exported there (`renderer/apps/projects/ProjectParts.tsx` is the example).

## Families

The rail and the sheet numbers (`SG-01`, ...) follow `FAMILIES` in `styleguideModel.ts`: Foundations, Actions, Inputs, Display, Feedback, Overlays, Layout, Patterns. Inside a family sheets are sorted by title. A family with no entries is left out.

## Limits

- Hover, focus and pressed states are live only: hover or tab to a specimen to see them. The styleguide has no way to freeze them, and they are not in captures.
- There is no deep link to one sheet. `deepLinkParse.ts` accepts only a 16-hex record id after `open/<appId>/`, so `project-ops://open/styleguide/<id>` is refused. Use the index rail, or the capture recipe below.
- A pre-opened menu closes on an outside click; "Reset specimens" on the sheet reopens it.
- A real dialog caps at the window height and scrolls its body; an `inline` one sizes by content, so a long body is cropped in the sheet instead.

## Capture a sheet

All captures go through `scripts/capture.mjs` (its header lists the options and env vars; it needs Xephyr). Build first, then open the styleguide by clicking its title bar button and scroll to the sheet by its anchor, `styleguide-<id>`. The eval's promise is awaited before the screenshot, so the scroll can wait for the screen to mount.

```bash
pnpm exec vite build --configLoader runner && pnpm build:electron
node scripts/capture.mjs --out /tmp/sheet.png --delay 4000 --eval "new Promise((done) => {
  [...document.querySelectorAll('.titlebar-nav-item')].find((b) => b.textContent.trim() === 'Styleguide').click();
  setTimeout(() => { document.getElementById('styleguide-toolbar').scrollIntoView({ block: 'start' }); done('ok'); }, 1000);
})"
```

Swap `styleguide-toolbar` for another sheet's id. The profile is seeded by default (`--empty` for none, `--seed-light` for light mode); click the Both button in the rail the same way to see both. See `CLAUDE.md` ("Verifying without a person") for the rest.

## Checklist

- [ ] `pnpm typecheck && pnpm test` exit 0
- [ ] the sheet has a use-for and a not-for list that name the neighbouring parts
- [ ] every specimen renders in Dark and Light and in Both without a repeated DOM id
- [ ] the sheet's `source` file is the one the code imports
