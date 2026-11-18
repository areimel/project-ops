# Add an IPC channel

**IPC** (inter-process communication) is how the sandboxed page asks the main process to do something it cannot do itself (read a file, call the network, show a notification) or how main pushes news to the page. Every channel is declared once, and both sides are typed from that declaration.

Flow: `shared/ipc/<part>.ts` (declaration) -> `electron/preload.ts` (the bridge, already generic) -> `electron/ipc/<part>.ts` (handler, validates every argument). The page calls `window.app.invoke("part:verb", ...args)`.

Channel names are `<part>:<verb-kebab>`: letters only, hyphens between words (`news:list`, `timer:set-label`). The prefix must be the name of the part file (`tests/ipc.test.ts` checks this). Parts: `app` (also `menu:`, `window:`, `log:`, `links:`), `data`, `settings`, `editor`, `clipboard`, `timer`, `system`, `news`, `player`.

There are three kinds:

| Kind | Declaration | Direction |
| --- | --- | --- |
| request | `invoke<[args], Result>()` | page asks, main answers |
| push | `event<Payload>()` | main tells the page (`emit` in main, `useAppEvent` in the page) |
| file drop | `drop<Result>()` | page passes dropped `File` objects; the preload turns them into paths |

## Add a channel to an existing part

1. `shared/ipc/<part>.ts`: add `"part:verb": invoke<[number], string>(),` to the object. Put types for arguments and results in the same file.
2. `electron/ipc/<part>.ts`: in `register()` add
   ```ts
   handle("part:verb", v.args(v.int(1, 100)), (n) => doTheWork(n));
   ```
   The second argument validates what the page sent. Use the checks in `electron/ipc/validate.ts`: `v.none`, `v.args(...)`, `v.string({max})`, `v.int(min,max)`, `v.bool`, `v.oneOf([...])`, `v.nullable`, `v.object({...})`, `v.recordId`, `v.collection`. Arguments beyond the checks you list are rejected, and each listed argument is checked, so list one check per declared argument.
3. Call it: `await window.app.invoke("part:verb", 5)`. Arguments and the result are typed from step 1. Errors arrive as `Error(message)`; show `errorMessage(e)` in a toast.
4. Push: declare `event<Payload>()`, call `emit("part:changed", payload)` from main code, and in the page `useAppEvent("part:changed", (p) => ...)`.

## Add a new part

Do the steps above in a new `shared/ipc/habits.ts` (export `habitsIpc`) and `electron/ipc/habits.ts` (export `register`), and wire them in:

- `shared/ipc/index.ts`: import `habitsIpc`; add it to both `IPC_PARTS` (as `habits`) and the `IPC` spread.
- `electron/ipc/index.ts`: import `register as habits` and add `habits` to the list in `registerIpc()`.

## Rules

- Never accept a file path, a URL, a shell command or an executable name from the page. Take an id or a key and look the real value up in main (see how News takes a story id, or how `links:open` takes a key of `brand.links`).
- Put the real work in a feature module under `electron/features/` with a pure part that does not import `electron` (like `netCore.ts`, `timerModel.ts`), and test the pure part in `tests/`.
- Results must be plain data (they cross the boundary by structured clone). Do not return paths; return display text (see `displayFolder`) or opaque ids.
- Only the main window's top frame may call a handler; `handle` enforces it.
- A request that a newer one replaces should throw `supersededError()` from `shared/superseded.ts`; callers ignore `isSuperseded(e)` silently. Re-check your counter after every `await`.
- If the work can outlive the window (a dialog, a fetch), check `getWindow()` after it.

## Checklist

- [ ] `pnpm typecheck && pnpm test` (`tests/ipc.test.ts` checks names and kinds)
- [ ] a wrong argument from the page gets `Invalid argument #1: expected ...` and the app does not crash (`tests/validate.test.ts` shows how to test validators)
- [ ] the page handles the error and the loading state
