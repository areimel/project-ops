# Add a command (shortcut, menu item, palette entry)

A command is declared once as a `CommandSpec`. From that one entry the app generates: the keyboard shortcut, the native menu item, the tooltip hint, the command palette entry and the `?` shortcut help.

```ts
{ id: "notes.pin", label: "Pin or unpin note", group: "Notes", keys: ["p"] }
```

| Field | Meaning |
| --- | --- |
| `id` | `<prefix>.<name>`. Prefix is `shell`, `go` or the app id. Pattern `^[a-z][a-z0-9-]*\.[a-zA-Z0-9-]+$`. |
| `label` | Sentence case, at most 60 characters. Used in the menu, palette and help. |
| `group` | Heading in the menu, palette and help. An app uses its own name. |
| `keys` | Plain keys the page handles: `"n"`, `"Shift+E"`, `"?"`, `"Delete"`, `" "` (space). Ignored while a text field has focus and when Ctrl, Alt or Cmd is held; Space and Enter are also left to a focused button, link or similar control. |
| `accelerator` | A chord the native menu handles: `"CmdOrCtrl+K"`, `"F11"`. The menu sends it to the page as `menu:command`. |
| `menu` / `palette` | Set `false` to leave it out of the menu or the palette. |

Use `keys` for single-letter actions and `accelerator` for chords. A command that has only `keys` is still listed in the menu, as a display-only shortcut. A command that has only an `accelerator` runs only from the menu or the palette, not from a bare keypress.

## An app command

1. Add the entry to the app's `commands` in `renderer/apps/<id>/index.ts` (or a `commands.ts` next to it, as the Editor and Player do). The id must start with `<id>.`.
2. Register the handler while the app is mounted, in the app component:
   ```tsx
   useCommandHandlers({ "notes.pin": togglePin });
   ```
   A command with no handler does nothing and is left out of the palette.
3. Use `useHint()` for the tooltip text: `title={hint("notes.pin")}`. Never write the key into a label by hand.
4. Run `pnpm test`. `tests/registry.test.ts` fails on duplicate ids, duplicate `keys` or duplicate accelerators across the shell commands plus that app's commands, and on more than 30 commands per app.

## A shell command (works everywhere)

1. Add it to `SHELL_COMMANDS` in `shared/commands.ts`, in one of the groups `File`, `View`, `Go`, `Help` (`SHELL_GROUPS`).
2. Add its handler in `renderer/shell/useShellCommands.ts` (the `handlers` object).
3. It appears in the native menu automatically (`electron/menuTemplate.ts` builds the File, View, Go and Help menus from the table).

`go.<id>` commands (`Ctrl/Cmd+1..9`) come from the registry order; do not declare them by hand.

## Checklist

- [ ] `pnpm typecheck && pnpm test`
- [ ] the key works, the menu item works, the palette finds it, `?` lists it
- [ ] it does nothing while a dialog is open (the shell turns commands off then)
- [ ] on macOS the hint shows the Cmd/Option symbols (not verified on a Mac so far)
