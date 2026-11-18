# Add a stored collection

A collection is a list of records saved as `<name>.json` in the app's data folder. Notes, Tasks and Clipboard snippets use one. You declare the shape once in `shared/collections/`; the main process store, the IPC channels, export/import/reset and the `useCollection` hook already handle any collection in that list.

Example name: `habits`. Names are lowercase letters, digits and hyphens (the file name must match `^[a-z0-9-]+\.json$`).

## Files to touch

| File | What |
| --- | --- |
| `shared/collections/habits.ts` | the spec: name, version, max, `heal()`, and the field types |
| `shared/collections/index.ts` | add it to `COLLECTIONS` |
| `renderer/apps/<app>/...` | use `useCollection("habits")` |
| `tests/store/heal.test.ts` | a test for your `heal()` |
| `renderer/settings/DataSection.tsx` | the import warning text names the collections (line 27); update it |

Nothing in `electron/` changes: `electron/ipc/data.ts` loops over `COLLECTIONS`, and the `data:*` channels check the collection name against that list.

## Steps

1. Write the spec. Copy `shared/collections/tasks.ts`:

   ```ts
   import type { CollectionSpec, RecordBase } from "./base";
   import { bool, isObject, str } from "./heal";

   export interface HabitFields { name: string; done: boolean }
   export type Habit = RecordBase & HabitFields;
   export const habits: CollectionSpec<HabitFields> = {
     name: "habits", version: 1, max: 500,
     heal: (raw) => {
       if (!isObject(raw)) return null;            // not an object: unusable
       const name = str(raw.name, 200);
       if (name.trim() === "") return null;        // a habit without a name is unusable
       return { name, done: bool(raw.done, false) };
     },
   };
   ```

   `heal` takes `unknown` and returns the fields only (not `id`, `createdAt`, `updatedAt`; the store adds those), filling defaults, cutting strings to limits and dropping unknown keys. It returns `null` when the record cannot be saved. It runs on every file read, create, update, restore and import, so it is the one place that decides what a valid record is. It must never throw and must return `null` for non-objects (`tests/store/heal.test.ts` checks this for every collection).

2. Register it in `shared/collections/index.ts`: import it and add `habits` to `COLLECTIONS`. The types (`CollectionName`, `RecordOf<"habits">`) follow from that.

3. Use it in the page:

   ```tsx
   const { items, status, error, create, update, remove, restore, reorder, reload } = useCollection("habits");
   ```

   `items` changes only when main pushes `data:changed`, so a mutation shows up after the promise resolves. `status` is `loading`, `ready` or `error`; draw all three (`reload()` is for a "Try again" button). `remove` returns `{ record, index }`; pass it to `restore` for an Undo toast (see Tasks). `reorder(ids)` takes a permutation of the current ids; order in the file is the order of the array.

4. Test your `heal` in `tests/store/heal.test.ts` (defaults, limits, unusable input).

5. Update the import text in `DataSection.tsx` so it names your collection.

## Rules

- Do not put paths or URLs in a record that main would later open. The page is untrusted; anything it can store, it can forge.
- `max` is a hard cap: create beyond it throws `Limit reached: <max> <name>`.
- Changing the shape later: raise `version` only together with a migration inside `heal()` that reads the old shape. A file with a higher `version` than the code is treated as written by a newer app: read-only, error message, never overwritten. A damaged file is moved aside as `<name>.json.unreadable-<timestamp>` before the first save.
- Export, import and "Reset all data" include the new collection automatically.

## Checklist

- [ ] `pnpm typecheck && pnpm test`
- [ ] create a record, quit, start again: it is still there (`pnpm dev`)
- [ ] hand-edit the data file to invalid JSON: the app starts empty and the broken file is kept as `.unreadable-<timestamp>`
- [ ] Settings > Data: export, reset, import round-trip includes your records
