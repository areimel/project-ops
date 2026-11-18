# Add an app (a new sheet)

An app is a folder in `renderer/apps/` plus one entry in the registry. The home menu, the side rail, the title block ("Sheet 3 of 8"), the command palette, the `Ctrl/Cmd+1..9` shortcuts and the native Go menu are all generated from that entry. The example below is called `habits`; use your own id.

The id must match `^[a-z][a-z0-9-]{0,31}$`. It is also the prefix of the app's command ids (`habits.new`) and CSS classes (`.habits-`).

## Files to touch

| File | What |
| --- | --- |
| `renderer/apps/habits/index.ts` | the `AppDefinition` |
| `renderer/apps/habits/HabitsApp.tsx` | the screen; default export |
| `renderer/apps/habits/habits.css` | styles, classes prefixed `habits-` |
| `renderer/apps/habits/habitsModel.ts` | pure logic (filtering, sorting, labels) |
| `tests/apps/habitsModel.test.ts` | tests for the model |
| `renderer/components/common/Icon.tsx` | one path in `PATHS` for the sheet icon |
| `renderer/apps/registry.ts` | one import and one array entry |
| `tests/registry.test.ts` | the expected id list (line 7) |

## Steps

1. **Definition.** Copy `renderer/apps/notes/index.ts`:

   ```ts
   import { lazy } from "react";
   import type { AppDefinition } from "../types";

   export const habits: AppDefinition = {
     id: "habits",
     name: "Habits",
     icon: "habits",                 // must be a key of PATHS in Icon.tsx
     summary: "What this sheet demonstrates, one line",   // shown in the sheet index
     component: lazy(() => import("./HabitsApp")),
     commands: [
       { id: "habits.new", label: "New habit", group: "Habits", accelerator: "CmdOrCtrl+N" },
     ],
   };
   ```

2. **Icon.** Add `habits: "<svg path d string>"` to `PATHS` in `renderer/components/common/Icon.tsx`: one `d` string on a 24 by 24 grid, 3 px margin, stroke only (the set is line art drawn with `currentColor`).
3. **Screen.** `HabitsApp.tsx` default-exports a component whose root is `<div className="app-root habits">`. Use `renderer/components/common/*` (Button, List, EmptyState, Spinner, SplitPane, Toolbar, TextField, ...) before writing your own markup. Import `./habits.css` and use only tokens (`var(--surface)`, `var(--sp-3)`, ...), never raw colours.
4. **Shell hooks** from `renderer/shell/ShellContext`:
   - `useShell()`: `toast(kind, message, action?)`, `confirm({...})`, `navigate`, `route` (`route.recordId` is set by a deep link `app-template://open/habits/<recordId>`).
   - `useTitleInfo({ count: "3 habits", saveState: "saved" })`: fills the title block.
   - `useCommandHandlers({ "habits.new": createHabit })`: handlers for the commands you declared. A command without a handler does nothing and is hidden from the palette.
   - `useNavigationGuard(message | null)`: while a message is set, leaving the sheet or closing the window asks first. Use it for unsaved work.
5. **Commands.** A command has `keys` (plain keys the page handles, such as `["n"]`, ignored while a text field has focus) and/or an `accelerator` (`CmdOrCtrl+N`, handled by the native menu). Ids must start with `habits.`; keys and accelerators must not repeat any in the shell or in the same app (`tests/registry.test.ts` checks). Limits: 30 commands per app, 20 apps in the menu. See `add-a-command.md`.
6. **Registry.** In `renderer/apps/registry.ts` add `import { habits } from "./habits";` and append `habits` to `APPS`. Order is the sheet number; only the first nine get `Ctrl/Cmd+1..9`.
7. **Test list.** In `tests/registry.test.ts`, add `"habits"` to the array in the "has the eight demos in sheet order" test (and rename the test).
8. **Model test.** Put branching logic in `habitsModel.ts` and test it in `tests/apps/habitsModel.test.ts` (see `tests/apps/notesModel.test.ts`).
9. **Saved records:** `add-a-stored-collection.md`. **Main-process work:** `add-an-ipc-channel.md`.
10. **Website:** the demo list on the site is in `website/src/config/content.ts`; add the app there if the site should show it.

## Checklist

- [ ] `pnpm typecheck && pnpm test` exit 0
- [ ] `pnpm dev`: the sheet appears on the home menu and in the rail, opens from the palette (`Ctrl/Cmd+K`) and from `Ctrl/Cmd+<number>`
- [ ] shortcuts and menu items appear under the app's group in the `?` help and the native menu
- [ ] empty, loading and error states are drawn (copy says what happened and what to do)
- [ ] works in all three themes, light and dark (Settings)
