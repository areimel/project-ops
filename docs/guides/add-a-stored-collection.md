# Add a main-only stored collection

A collection is a list of records saved as `<name>.json` in the app's data folder, with the store, healing, atomic writes and change listeners already written. The two that exist, `projects` and `project-roots`, are **main-only**: no channel lets the page read or write a collection by name. The page gets path-free views through dedicated `projects:*` channels. A new collection follows the same pattern.

Example name: `groups`. Names are lowercase letters, digits and hyphens (file name `^[a-z0-9-]+\.json$`).

## Files to touch

| File | What |
| --- | --- |
| `shared/<area>/groups.ts` | the `CollectionSpec`: name, version, max, `heal()`, field types, and a view type if the page sees it |
| `electron/store/<area>.ts` | `export const groupsStore = () => openCollection(groupSpec)` (see `electron/store/projects.ts`) |
| `electron/features/...`, `shared/ipc/...`, `electron/ipc/...` | the logic and the channels that expose a view (`add-an-ipc-channel.md`) |
| `electron/store/bundle.ts` | add the spec's name to `COLLECTION_NAMES` if it belongs in export and import |
| `electron/store/dataTransfer.ts` | add it to `targets()` so export, import and reset include it |
| `tests/` | a heal test beside `tests/projects/heal.test.ts` |
| `renderer/settings/DataSection.tsx` | the import and reset text names what is included; update it |

## Steps

1. Write the spec (see `shared/projects/roots.ts`, the smallest one):
   ```ts
   export interface GroupFields { name: string }
   export const groupSpec: CollectionSpec<GroupFields> = {
     name: "groups", version: 1, max: 100,
     heal: (raw) => {
       if (!isObject(raw)) return null;
       const name = line(raw.name, 80);
       return name === "" ? null : { name };
     },
   };
   ```
   `heal` takes `unknown` and returns the fields only (the store adds `id`, `createdAt`, `updatedAt`), fills defaults, cuts to limits, drops unknown keys and returns `null` when the record cannot be saved. It runs on every file read, create, update and `replaceAll`, so it is the one place that decides what a valid record is. It must never throw. Helpers: `shared/collections/heal.ts` (`line`, `str`, `bool`, `strList`, `oneOf`, `timestamp`).
2. Open it in main: `openCollection(spec)` returns the `Collection` (`list`, `get`, `create`, `update`, `remove`, `restore`, `reorder`, `replaceAll`, `clear`, `onChange`; `restore` takes a record, so never wire it to a page-supplied value). It is cached per spec name.
3. Never hand the page a record that holds a path, and never let it write one. Send a view built by a pure function (`toProjectView`) and take edits as a patch healed to the user-editable fields (`healProjectPatch`).
4. If the page should follow changes, `emit` a push from an `onChange` listener (see `initProjects` in `electron/features/projects.ts`) and read it with a `pushStore`.
5. Test `heal` for defaults, limits and unusable input.

## Rules

- `max` is a hard cap: create beyond it throws `Limit reached: <max> <name>`.
- Changing the shape later: raise `version` only together with a migration in `heal()`. A file with a higher `version` is "newer": read as an error, never overwritten. A damaged file is moved aside as `<name>.json.unreadable-<timestamp>` before the first write.
- A field with a default needs no version bump: an old file heals to the default.
- Export, import and reset cover only the collections listed in `COLLECTION_NAMES` and `targets()`.

## Checklist

- [ ] `pnpm typecheck && pnpm test`
- [ ] create a record, quit, start again: it is still there
- [ ] hand-edit the file to invalid JSON: the app starts empty and the broken file is kept as `.unreadable-<timestamp>`
- [ ] Settings > Data: export, reset, import round-trip includes it
