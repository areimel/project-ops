# The projects feature: task guide

How the pieces fit is in `CLAUDE.md` ("How it fits together"). This guide lists what to touch for the common changes and where each test lives. Terms: a **record** is a stored project (with a real path, main only); a **view** (`ProjectView`) is what the page gets, with no path; a **patch** is what the page may send back, healed by `healProjectPatch`; a **scan** reads folders under the scan roots.

Always finish with `pnpm typecheck && pnpm test` and check the exit status. Before changing card, dialog or dossier markup, read the matching sheets in the styleguide (`docs/guides/styleguide.md`; the project card, trait rows, dossier cells and dialog form are under `renderer/apps/styleguide/entries/patterns/`).

## Where each test lives

| Area | Test file |
| --- | --- |
| Record heal, patch heal, `toProjectView`, roots, `healLink` | `tests/projects/heal.test.ts` |
| Launcher table (ids, argv per platform) | `tests/projects/launchers.test.ts` |
| Markers, skip list, stack, meta, category hint, `mergeScan` | `tests/main/projectScanCore.test.ts` |
| Git parsers, remote URL cleaning, config parsing and the allowlist, HEAD and origin from files | `tests/main/gitInfoCore.test.ts` |
| Child environment, PATH lookup, `isInside`, launcher choice, bundle names | `tests/main/launchCore.test.ts` |
| Root counts, `afterRootRemoved`, `scanFacts`, `gitTargets`, `finishScan` | `tests/main/projectsCore.test.ts` |
| Folder display text (`displayPath`) | `tests/main/files.test.ts` |
| Export, import, reset | `tests/store/bundle.test.ts` |
| Search, filters, sort, facets | `tests/apps/projectsModel.test.ts` |
| Tag cycle, rail tags, reveal, stored view state, card model | `tests/apps/projectsView.test.ts` |
| Edit form and the patch it sends | `tests/apps/projectDraft.test.ts` |
| Dossier model (serial, barcode, site rows, timeline) | `tests/apps/dossierModel.test.ts` |
| Settings pickers and scan summary | `tests/projectsSettingsModel.test.ts` |
| `pushStore` | `tests/pushStore.test.ts` |

## Add a field to the project record

Example: a `notes` text the owner types.

1. `shared/projects/record.ts`: add the field to `ProjectFields`, a limit to `PROJECT_LIMITS`, and its line in `healProject` (use the helpers in `shared/collections/heal.ts`). A field with a default needs no `version` bump: an old file heals to the default. A change of meaning does need a bump and a migration in `healProject`.
2. `shared/projects/patch.ts`: if the owner edits it, add it to `ProjectPatch` and `healProjectPatch` (an invalid value drops the key).
3. `shared/projects/view.ts`: add it to `ProjectView` and `toProjectView`. If the edit form must tell "set by you" from "detected", follow `overrides` and `detected`.
4. (A field only main writes, like `lastOpenedAt`, skips the patch step: `healProjectPatch` must keep ignoring it.) Records are built by hand in two places that need the new field: `newManualProject` in `electron/features/projectsCore.ts` and the new-record literal in `mergeScan` in `electron/features/projectScanCore.ts`.
5. Page: show it in `renderer/apps/projects/ProjectCard.tsx` (git, link and open-button pieces shared with the dossier and the dashboard tile are in `ProjectParts.tsx`), edit it in `ProjectDialog.tsx` (a `FormDialog` with `.form-grid`; fields take `error`) and `projectDraft.ts` (`ProjectDraft`, `draftFromView`, `draftPatch`), filter or search it in `projectsModel.ts` (`matchesQuery`, `passes`, facets, `ProjectFilters`; stored filters are healed in `filterState.ts`, so a new filter needs a line in `healViewState`).
6. Export and import need nothing: the bundle holds whole records and heals them.
7. Tests: `tests/projects/heal.test.ts` (defaults, limits, patch), then the page-side tests above.

Never add a field main would later open (a path, a command) that the patch can set.

## Site details and the dossier page

Site details are the `site` field of the record (`ProjectSite` in `shared/projects/record.ts`: client, hosting, launch date as `YYYY-MM-DD` or null, services, notes). Their limits are in `PROJECT_LIMITS`; the patch heals each key on its own (`patch.ts`). The edit form's Site section is `renderer/apps/projects/SiteFields.tsx`, and `projectDraft.ts` sends only the changed keys.

The dossier page is `renderer/apps/projects/dossier/`: `ProjectDossier.tsx` (the page and its file plate), `DossierCells.tsx` (one component per cell), `DossierGraphics.tsx` (hazard band, barcode, registration marks, stamp) and `dossier.css`. The layout is `Mosaic` and `MosaicCell` (`renderer/components/common/Mosaic.tsx`, styles in `renderer/styles/mosaic.css`): a 12-column hairline grid (the gaps are the lines). Under 720px of container width each cell takes the full row unless it sets `narrowSpan={6}` (pair two halves so no hole is left); under 480px everything is one column.

To add a cell:

1. Write its pure parts in `dossier/dossierModel.ts` (what to show, what is empty) and a test in `tests/apps/dossierModel.test.ts`. Keep branching out of the component.
2. Add the component to `DossierCells.tsx` and place it in `ProjectDossier.tsx` as a `MosaicCell` with a `label` (kicker text) and `span` (columns, 12 wide by default); use `end` for a trailing control. Reuse `KeyValue`, `Button` and `EmptyState`. A new cell or card piece also gets a pattern sheet or an edit to the existing one in the styleguide.
3. Colours and sizes come from tokens only; no hover motion.

## Add a launcher (editor or terminal)

`shared/launchers.ts`: add an entry to `EDITOR_TABLE` or `TERMINAL_TABLE`: `id`, `label`, and for each platform a builder. `run("cmd", ...before)` gives `cmd ...before <dir>`; write a function for flags such as `--working-directory=<dir>`. The folder is always its own argv element. Add the id to the expected lists in `tests/projects/launchers.test.ts`. Nothing else changes: the Settings pickers (`projectsSettingsModel.ts`), detection (`which`) and validation (`isEditorId`, `isTerminalId`) read the table. Notes:

- Detection looks the command up on `PATH` (absolute entries only). A program that is an app bundle or a Flatpak is not found by name.
- macOS entries use `open -a <App>` and are untested; Windows entries are untested, and a `.cmd` shim such as `code.cmd` probably cannot be started with `shell: false` (`launch.ts` explains why this is left).
- Do not add an entry whose command could be a path or contain a separator; `resolveOnPath` refuses those.

## Add a project marker or a stack id

Marker (what makes a folder a project): `PROJECT_MARKERS` in `electron/features/projectScanCore.ts` (exact file names; `isMarkerName` also matches `.sln` and `.csproj` by pattern). Tests: `isProjectDir` in `tests/main/projectScanCore.test.ts`. Remember that the walk stops at the first marker folder, so a marker that appears in many non-project folders hides projects nested below them. Folders never descended into: `SKIP_DIRS` and any name starting with `.` (`shouldDescend`). Depth: `MAX_DEPTH` (4).

Stack id: add a rule to `STACK_RULES` (`file` tests a file name; `dep` lists `package.json` dependency names), in the order you want ids shown. Add a display name to `STACK_LABELS` in `renderer/apps/projects/cardModel.ts` (an unknown id is shown as is). Stack ids are at most 32 characters and 24 per project (`PROJECT_LIMITS`). Tests: `detectStack` in `tests/main/projectScanCore.test.ts`. The name is always the folder name; the description is read from `package.json` only (`detectMeta`), as are dependencies for stack ids.

An existing project gets a new stack id on the next scan or refresh.

## Change the git allowlist

`ALLOWED` in `electron/features/gitInfoCore.ts` is the list of config keys a repository may have for git to run in it: `plain` keys have no subsection (`core.filemode`), `sub` keys have one (`remote.origin.url`). If a repository's `.git/config` has any key not listed, git is not run there: branch and remote come from `.git/HEAD` and `.git/config`, and last commit and uncommitted changes stay empty. To allow a key, it must be plain data that cannot name a program or load another file: not `core.fsmonitor`, `core.sshCommand`, `core.pager`, `include.*`, `includeIf.*`, `filter.*`, `diff.*.textconv`, `alias.*`, `extensions.*`, `gpg.*` and similar. Values are checked too (`plainConfigValues`: format version 0, no `!` submodule update, no `<helper>::<address>` URLs); extend that function if the new key's value can carry a command. Tests: `isPlainConfigText and isPlainRepoConfig` in `tests/main/gitInfoCore.test.ts` (add the key as allowed and a hostile variant as refused). `core.hookspath` and `branch.<name>.github-pr-base-branch` are on the list on purpose: every call overrides hooks with `-c core.hooksPath=/dev/null`, and the gh CLI writes the other as plain data. Git is also pinned to the checked folder (`--git-dir`, `--work-tree`, a ceiling directory, `.git/HEAD`, `objects/` and `refs/` must exist, inherited `GIT_*` variables stripped in `gitInfo.ts`), so an incomplete `.git` cannot make git read a parent repository's config. The log line "not running git in a project folder: ..." names the first keys that failed.

The fixed arguments git runs with are `SAFE_ARGS` in `electron/features/gitInfo.ts`.

## Checklist

- [ ] `pnpm typecheck && pnpm test` exit 0
- [ ] a seeded `projects.json` (`CLAUDE.md`, "Verifying without a person") still loads, and a record without the new field heals to the default
- [ ] no view, push or error message contains an absolute path
