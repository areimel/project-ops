# Dashboard home screen

## Context

The owner wants a quick launchpad as the app's home: pinned projects, recently opened projects and a set of their own shortcut links (hosting, domains, analytics...). The projects grid already shows pinned first, but it is a dense browse-and-filter screen; the dashboard is the compact start-of-session screen, with the grid one step away.

Decided with the owner:
- **Purpose:** quick launchpad (compact tiles, one-click open), not a status overview.
- **Recent** = last opened from Project Ops (editor, terminal or folder). Needs a new stored timestamp.
- **Resource links** are grouped: each link has a name, a URL and an optional group name; shown under group headings.
- **Approach A:** the dashboard is a new first entry in `APPS`; the grid becomes the second screen.

My calls (not owner decisions; change freely if they turn out wrong):
- A Dashboard / Projects switch in the title bar, because the shell has no visible screen navigation.
- Recent shows the 8 most recently opened, leaving out pinned projects (already above) and missing folders.
- Pinned tiles are ordered by name (stable positions); all pinned projects show, missing ones muted with open buttons disabled.
- Recording an open does not bump `updatedAt` (the grid's "Last edited" sort must not move).
- Links are edited on the dashboard in a dialog (add, edit, remove with confirm); ordered ungrouped first, then groups A-Z, names A-Z inside a group. No drag reordering.
- Links are https only (`healLink`), max 100, name max 60, group max 40.
- `shell.home` label becomes "Go home".
- Closing Settings (toggle or Escape) goes home, so it now lands on the dashboard even when Settings was opened from the grid. Accepted for now; returning to the previous screen would be a router change.

Non-goals: status counts or charts, drag-to-reorder, http/localhost links, favicons (the page has no network), a pin/edit control on tiles (that stays in the grid), tracking opens made outside the app.

### Approaches considered
- **A (picked):** new first app in the registry. Reuses router, Go menu, Ctrl+1/2, deep links; needs a title-bar switch.
- **B:** strip above the grid. No navigation work, but crowds the grid and shows pinned twice.
- **C:** shell-level home view outside the registry. More shell change for the same result.

## Design

### 1. `lastOpenedAt` on the project record
- `shared/projects/record.ts`: add `lastOpenedAt: number | null` to `ProjectFields`; `healProject` uses `timestamp(raw.lastOpenedAt)` (`shared/collections/heal.ts`). Defaults to null, so no version bump.
- `shared/projects/view.ts`: add to `ProjectView` and `toProjectView`.
- Hand-built record literals: `mergeScan` new-record literal (`electron/features/projectScanCore.ts`) and `newManualProject` (`electron/features/projectsCore.ts`) get `lastOpenedAt: null`.
- `healProjectPatch` already ignores unknown keys, so the page cannot set it. Add a test that says so.
- `electron/store/collectionCore.ts`: `update(id, patch, opts?: { keepUpdatedAt?: boolean })`; with the option the stored `updatedAt` is kept. Test in `tests/store/`.
- `electron/features/projects.ts` `open()`: restructure so all three targets (the `folder` branch returns early today) reach one write after `openFolder` / `launch` resolves. Re-read the record after the await with the same guard `refresh` uses (record exists and `current.path === path`, since an import can replace it), then `projectsStore().update(id, { lastOpenedAt: Date.now() }, { keepUpdatedAt: true })` inside try/catch with `log.warn`: a failed store write must not turn a successful open into an error toast. A failed launch records nothing. `APP_LAUNCH_DRY` runs still record (lets capture runs verify it). The existing `onChange` pushes `projects:changed`.

### 2. Resource links (new main-only collection)
- `shared/resources/links.ts`: `ResourceLinkFields { name, url, group }`, `RESOURCE_LIMITS`, `healResourceLink(raw)` (null when name is empty or `healLink(url)` is null; `healLink` is imported from `shared/projects/record.ts`), `resourceLinkSpec` (`name: "resource-links"`, version 1, max 100), `healResourceLinkPatch(raw)` (only `name`, `url`, `group`; invalid values dropped), `ResourceLinkView { id, name, url, group }`, `toResourceLinkView`.
- `electron/store/resources.ts`: `resourceLinksStore()` via `openCollection`.
- `shared/ipc/resources.ts`, merged in `shared/ipc/index.ts`:
  - `resources:list` → `ResourceLinkView[]`
  - `resources:create` `[patch]` → view (throws when the healed patch lacks a valid name or URL, or the list is full)
  - `resources:update` `[id, patch]` → view
  - `resources:remove` `[id]`
  - `resources:open` `[id]` (main looks the URL up and calls `openExternalHttps`, `electron/features/links.ts`)
  - event `resources:changed` → `ResourceLinkView[]`
- `resources` must be added to both `IPC_PARTS` and the `IPC` spread in `shared/ipc/index.ts` (`tests/ipc.test.ts` compares them).
- `create` checks the healed patch and the count itself and throws owner-readable messages ("Enter a name", "Enter an https link", "You can keep at most 100 links") rather than the store's generic ones.
- `electron/features/resources.ts` (handlers' logic, `onChange` → `emit`), `electron/ipc/resources.ts` (`v.raw` for the patch only, `v.recordId` elsewhere), registered in `electron/ipc/index.ts`; init next to `initProjects` in `main.ts`.
- Export/import/reset: add the spec name to `COLLECTION_NAMES` (`electron/store/bundle.ts`) and to `targets()` (`electron/store/dataTransfer.ts`); update the reset wording in `renderer/settings/DataSection.tsx`. Extend `tests/store/bundle.test.ts`.
- Rule note: this is the second channel family where a URL arrives from the page, handled like `projects:update` (healed in main on store, opened by id). CLAUDE.md's rule text gets the exception written down.

### 3. Dashboard screen (`renderer/apps/dashboard/`)
- `index.ts` (definition: id `dashboard`, name "Dashboard", icon `home`, command `dashboard.add-link`, palette only), `DashboardApp.tsx` (wiring), `ProjectTile.tsx`, `ResourceLinks.tsx`, `LinkDialog.tsx`, `dashboard.css` (classes `dashboard-`, tokens only), pure `dashboardModel.ts`.
- `dashboardModel.ts` (tested in `tests/apps/dashboardModel.test.ts`): `pinnedTiles(projects)`, `recentTiles(projects, limit = 8)`, `groupLinks(links)` → `{ group, links }[]`, `knownGroups(links)` (suggestions), link draft: `emptyDraft`, `draftFrom(view)`, `draftError(draft)`, `draftPatch(draft, original?)` (changed fields only, like `projectDraft.ts`).
- Tile: `Card` with status light (`cardStatus`, `cardMuted` from `renderer/apps/projects/cardModel.ts`), name, branch + dirty marker + `relativeTime` (`renderer/apps/projects/projectsModel.ts`) of last commit; all tile styles live in `dashboard.css` (`projects.css` is not loaded here), labelled Editor button, terminal and folder `IconButton`s (disabled when missing). The name is a button: `navigate({ type: "open", appId: "projects", recordId })`, which the grid already reveals and scrolls to.
- Sections: "Pinned" (with an "All projects" link button), "Recent", "Resources" (Add link button). Each has an `EmptyState`/one-line hint when empty; Pinned and Recent both empty with no projects at all points to the Projects screen to add a scan folder.
- Data: `useProjects()` (shared push store; `open` via `useAttempt`), new `renderer/hooks/useResourceLinks.ts` (`createPushStore({ load, subscribe, initial })` like `useProjectRoots.ts`: list, create, update, remove, open).
- `LinkDialog`: laid out like `ProjectDialog.tsx`: `Dialog`, `TextField` (type `text`; there is no `url` type) for name and URL, `Combobox` for group with `knownGroups`; error text from `draftError` beside the URL field; Save is a footer button; Remove (edit mode) goes through `useShell().confirm`.
- `useTitleInfo`: `count` is a string, e.g. "3 pinned".

### 4. Shell
- `renderer/apps/registry.ts`: `APPS = [dashboard, projects]`.
- `renderer/shell/TitleBar.tsx` is props-only, so `renderer/shell/AppShell.tsx` passes it the app list, the active app id (null in Settings) and `onOpen(id)` → `navigate({ type: "open", appId })`. With more than one app it renders one button per app (`aria-current` on the active one, tooltip from the existing `hintOf("go.<id>")` prop); the switch also works from Settings. Replace the hard-coded "Go to projects" / "Back to projects" labels (TitleBar, and `renderer/shell/ErrorBoundary.tsx`) with ones derived from the home app's name. Styles in the existing shell/layout CSS with tokens.
- `shared/commands.ts`: `shell.home` label "Go home".
- `ProjectsApp.tsx`: fix the "home screen" comment.

### 5. Tests to update
`tests/registry.test.ts` (ids), `tests/main/menuTemplate.test.ts` (label), fixtures with full `ProjectRecord`/`ProjectView` literals (`tests/main/projectScanCore.test.ts`, `tests/main/projectsCore.test.ts`, `tests/apps/projectDraft.test.ts`, `projectsModel.test.ts`, `projectsView.test.ts`), `tests/projects/heal.test.ts` (defaults). New: `tests/resources/heal.test.ts`, `tests/apps/dashboardModel.test.ts`, collection `keepUpdatedAt` test.

### 6. Docs
- Save this design as `docs/superpowers/specs/2026-11-19-dashboard-home-design.md`.
- `CLAUDE.md` (overview, layout, IPC parts, stored data table, bundle shape, rules exception, commands, capture example note that home is the dashboard), `docs/guides/projects.md` where it lists record-field steps; `docs/guides/add-an-app.md` ("one app", "no navigation UI", expected ids), `add-a-stored-collection.md` ("the two that exist"), `add-an-ipc-channel.md` (parts list); the "both" comments in `electron/store/dataTransfer.ts` and `electron/features/projects.ts`; `CHANGELOG.md` bullets under the newest existing version heading (format checked by `tests/changelog.test.ts`).

