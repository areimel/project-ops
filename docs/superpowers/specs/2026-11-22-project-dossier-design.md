# Project dossier page + site details (design, 2026-11-22)

## Context

Projects have no detail view: a card opens a small edit dialog, and `project-ops://open/projects/<id>` (and a dashboard tile's name) only scrolls the grid to the card. The owner wants one **profile page per project** in the app, laid out as a seamless mosaic grid like a dossier, in the existing Kojima "high-tech micro graphics" direction (refs: `docs/design-examples/*.jpg`: spec-label grid, hazard-stripe panels, stamped log-ID boxes, barcodes). Many projects are client websites, so the record also gains **site details**.

Decisions made with the owner:
- In-app page, **inside the Projects screen**: `open/projects/<id>` shows the dossier in place of the grid; "All projects" returns to the grid with the card revealed. Card names and dashboard tile names open it. No router/title-bar changes.
- New stored fields: **client, hosting, launch date, services used** (Web3Forms, SendGrid, ...), **notes**. Domain is derived from the existing Site link (no field).
- Editing stays in the existing edit dialog (gains a Site section); the page is read-and-act.
- **Full dossier** micro-graphics: hazard band, serial from the record id, barcode, stamped status, registration marks — all CSS/SVG from tokens.

Non-goals: no filter-rail facet for hosting/services, no inline editing, no website/ (Astro) changes, no new IPC channels, no secrets storage (notes copy says so).

## Design (frontend-design pass)

Palette and type are fixed by Kojima tokens (`renderer/theme/`): charcoal/ivory, safety orange `--accent`, DM Sans heavy display, mono `.label` system. No new colours; one new token `--fs-display` (≈48px) for the dossier name, plus hazard-stripe width tokens.

**One memorable thing: the file plate** (top row) — hazard band with the serial, a stamped status box, and a barcode generated from the id. Everything below is quiet: hairline mosaic cells, mono labels, DM Sans values. No numbered markers except the timeline (a real sequence). No hover animation; motion only on actions, off under reduced motion.

Seamless mosaic: CSS grid, 12 columns, `gap: var(--line-w)` over `background: var(--line)`, cells on `var(--surface)` → shared hairlines, no cards/shadows. Container queries collapse to 6 columns then 1.

```
< All projects                                  [Refresh] [Pin] [Edit]
┌────────────────────────────────────────────────────────────────────┐
│/////////// FILE PO-0123-4567-89AB ////////// hazard band //////////│
├───────────────────────────────────────┬─────────────┬──────────────┤
│ ⌜ Client work (category)              │   STATUS    │ ▌▌▌▌ ▌▌▌ ▌▌▌ │
│   Project name (display)              │ ╔═════════╗ │ PO-0123-…    │
│   Description…                        │ ║ ACTIVE  ║ │ ⁘ pinned     │
│   [tag] [tag] [tag]                 ⌟ │ ╚═════════╝ │              │
├──────────────────┬────────────────────┼─────────────┴──────────────┤
│ SITE             │ GIT                │ STACK                      │
│ Client   Acme    │ Branch  main ■     │ Astro  TypeScript  Node    │
│ Hosting  Netlify │ Commit  2 days ago │                            │
│ Domain   acme.co │ Remote  github/…   │ SERVICES                   │
│ Launch   2026-03 │                    │ [Web3Forms] [SendGrid]     │
├──────────────────┴────────────────────┼────────────────────────────┤
│ NOTES (pre-wrap, ≤ 80ch)              │ LINKS  Repo ↗ Site ↗ Docs ↗ │
├───────────────────────────────────────┴────────────────────────────┤
│ TIMELINE  ●added ──●launched ──●last commit ──●edited ──●opened    │
├────────────────────────────────────────────────────────────────────┤
│ LOCATION ~/…/clients/acme   [Editor] [Terminal] [Folder] [Copy]    │
└────────────────────────────────────────────────────────────────────┘
```
Empty site cell: "No site details yet" + "Add site details" (opens edit dialog). Missing folder: plate stamp reads "Folder missing" (danger), open buttons disabled. Unknown id: `EmptyState` with back button.

## Implementation

### Shared (record, patch, view)
- `shared/collections/heal.ts`: add `text(x, max)` — multi-line: `\r\n`→`\n`, control chars except `\n`/`\t` stripped, trimmed, capped. Reuse existing `isoDate`, `line`, `strList`.
- `shared/projects/record.ts`: `ProjectSite { client: string; hosting: string; launchDate: string | null; services: string[]; notes: string }`, `emptySite()`, `healSite()`, `site` on `ProjectFields` healed in `healProject` (old files heal to empty; no version bump). Limits: `client 80, hosting 48, services 20, service 40, notes 4000`.
- `shared/projects/patch.ts`: `site?: Partial<ProjectSite>` healed key by key (invalid value drops the key; `launchDate` null/"" clears); `applyProjectPatch` merges `site` like `links`.
- `shared/projects/view.ts`: `site` copied into `ProjectView`.
- New-record literals: `newManualProject` (`electron/features/projectsCore.ts`) and `mergeScan` (`electron/features/projectScanCore.ts:~164`) get `site: emptySite()`.
- Tests: `tests/projects/heal.test.ts` (+ patch tests) for heal/patch/apply/old-file healing; `text()` tests.

### Projects model + edit dialog
- `projectsModel.ts`: `matchesQuery` also searches client, hosting, services; add `allHosting`, `allServices` using the existing `distinct()` helper (beside `allTags`/`allCategories`).
- `projectDraft.ts`: draft gains `site` (strings; launchDate "" ↔ null); `draftPatch` sends only changed site keys.
- `ProjectDialog.tsx` + new `SiteFields.tsx` (keeps both < 300 lines): Client `TextField`, Hosting `Combobox` (suggestions), Launch date `TextField type="date"`, Services `TagInput` (suggestions), Notes `TextArea` ("Don't store passwords here").
- Tests in `tests/apps/` for draft/patch and search.

### Mosaic component + graphics
- `renderer/components/common/Mosaic.tsx`: `Mosaic` (grid) and `MosaicCell({ label, span, rowSpan, as, className, children, end })` — the cell label uses the `.label`/`.kicker` system. Used ~9× on the dossier → common component. Styles in new `renderer/styles/mosaic.css` (imported in `styles/index.css`), tokens only.
- `renderer/apps/projects/dossier/DossierGraphics.tsx`: `HazardBand`, `Barcode` (SVG rects, `currentColor`), `RegMarks` (corner crosshairs), `Stamp` (double-ruled status box using `cardStatus` tone). All `aria-hidden` except Stamp's text.
- `renderer/apps/projects/dossier/dossierModel.ts` (pure): `fileSerial(id)` → `PO-XXXX-XXXX-XXXX`, `barcodeBars(id)` (widths from hex nibbles, deterministic), `siteDomain(links.site)` → hostname, `siteRows(p)`, `hasSiteDetails(p)`, `timeline(p)` → sorted present events (added, launched, last commit, edited, opened, scanned). Test: `tests/apps/dossierModel.test.ts`.

### Dossier page + routing
- `renderer/apps/projects/dossier/ProjectDossier.tsx` (page, plate, toolbar) + `DossierCells.tsx` (site/git/stack/services/notes/links/timeline/location cells) — reuse `KeyValueList/KeyValue`, `Badge`, `Button`, `IconButton`, `StatusDot`, `EmptyState`, and from `cardModel.ts`: `cardStatus`, `cardCategory`, `gitInfo`, `stackLabel`, `splitFolder`, `GIT_UNREAD_NOTE`; `relativeTime` from `projectsModel.ts`. CSS `dossier.css` with `projects-dossier-*` classes.
- Extract `renderer/apps/projects/useProjectActions.ts` from `ProjectsApp.tsx` (the `CardActions` memo); add `show(id)` and `refresh(id)` (`useProjects().refresh` exists).
- `ProjectsApp.tsx`: `profile` state set from `route.recordId` (replacing the current reveal-on-route behaviour); when set render `ProjectDossier` (hooks stay mounted so filters survive); back = `setProfile(null)` + `setPendingFocus(id)` (existing reveal path). `ProjectDialog` shared by both. Palette command `projects.back` ("Back to all projects"), active only on the dossier.
- `ProjectCard.tsx`: name becomes a button → `show(id)`. `dashboard/ProjectTile.tsx`: title text "Open {name}" (it already navigates to `open/projects/<id>`).

### Docs
- `docs/superpowers/specs/2026-11-22-project-dossier-design.md` (this design, committed first).
- `CLAUDE.md` (layout, record field list, dossier in "The projects screen", deep-link meaning), `docs/guides/projects.md`, `CHANGELOG.md` new `0.2.0 - 2026-11-22` entry.

## Execution: TODO list and subagents

| # | Task | Agent | Wave |
|---|------|-------|------|
| 1 | Write + commit design spec | me | 0 |
| 2 | Shared record/patch/view/`text()`/literals + tests | Sonnet A | 1 |
| 3 | Mosaic component + mosaic.css + DossierGraphics + dossierModel + tests | Sonnet B | 1 |
| 4 | Draft + SiteFields + dialog | Sonnet C | 2 |
| 5 | Search + `allHosting/allServices` + tests | Haiku D | 2 |
| 6 | Dossier page, useProjectActions, routing, card/tile entry | Sonnet E | 2 |
| 7 | Code review of the full diff | Sonnet F (code-reviewer) | 3 |
| 8 | CLAUDE.md / guide / CHANGELOG | Haiku G | 3 |
| 9 | Capture screenshots (dark/light, wide/narrow, missing, empty site), design critique, fixes | me | 3 |

Agents in a wave get disjoint files; Wave 1 B codes against the `ProjectSite` shape above. I run gates and commit between waves.

Commits (each passes `pnpm typecheck && pnpm test`, exit status checked):
1. `Docs: project dossier page design`
2. `Shared: site details on the project record`
3. `Components: mosaic grid and dossier graphics`
4. `Projects: edit and search site details`
5. `Projects: dossier page for one project`
6. `Docs: describe the dossier and site details`

## Verification
- `pnpm typecheck && pnpm test` after each wave.
- Build + capture (CLAUDE.md "Verifying without a person"): seed `projects.json` with one project carrying site details and one without, `project-ops://open/projects/<id>`, `APP_CAPTURE_SIZE=1280x800` and `900x700`, dark and light (`settings.json` mode), a missing-folder record; `APP_CAPTURE_EVAL` checks `.projects-dossier` exists and cell count. Review PNGs, fix, re-capture.
- Capture with `APP_CAPTURE_KEYS` / eval clicking "All projects" to confirm the grid returns with the card selected.
