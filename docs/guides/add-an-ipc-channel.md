# Add an IPC channel

**IPC** (inter-process communication) is how the sandboxed page asks the main process to do something it cannot do itself, or how main pushes news to the page. Every channel is declared once, and both sides are typed from that declaration.

Flow: `shared/ipc/<part>.ts` (declaration) -> `electron/preload.ts` (the bridge, already generic) -> `electron/ipc/<part>.ts` (handler, validates every argument). The page calls `window.app.invoke("part:verb", ...args)`.

Channel names are `<part>:<verb-kebab>`: letters only, hyphens between words (`projects:open-link`, `projects:roots-add`). The prefix must be the part file's name (`tests/ipc.test.ts`). Parts today: `app` (also `menu:`, `window:`, `log:`, `links:`), `data`, `settings`, `projects`, `resources`.

| Kind | Declaration | Direction |
| --- | --- | --- |
| request | `invoke<[args], Result>()` | page asks, main answers |
| push | `event<Payload>()` | main tells the page (`emit` in main, `useAppEvent` in the page) |
| file drop | `drop<Result>()` | page passes dropped `File` objects; the preload turns them into paths (none declared now) |

## Add a channel to an existing part

1. `shared/ipc/<part>.ts`: add `"projects:verb": invoke<[id: string], string>(),`. Put argument and result types beside it.
2. `electron/ipc/<part>.ts`: in `register()` add
   ```ts
   handle("projects:verb", v.args(v.recordId), (id) => doTheWork(id));
   ```
   Validators are in `electron/ipc/validate.ts`: `v.none`, `v.args(...)`, `v.string({max})`, `v.int(min,max)`, `v.bool`, `v.oneOf([...])`, `v.nullable`, `v.object({...})`, `v.recordId`, and `v.raw` (passes anything through; use it only when the value goes straight into a `heal`, as the project patch does). List one check per declared argument; extra arguments are rejected.
3. Call it: `await window.app.invoke("projects:verb", id)`. Errors arrive as `Error(message)`; show `errorMessage(e)` in a toast and ignore `isSuperseded(e)`.
4. Push: declare `event<Payload>()`, call `emit("projects:changed", payload)` from main, and in the page use `useAppEvent`, or a `pushStore` (`renderer/hooks/pushStore.ts`) for "load once, then follow the push" state, as `useProjects` does.

## Add a new part

New `shared/ipc/<part>.ts` (export `<part>Ipc`) and `electron/ipc/<part>.ts` (export `register`), then:

- `shared/ipc/index.ts`: import it; add it to `IPC_PARTS` and the `IPC` spread.
- `electron/ipc/index.ts`: import `register` under a new name and add it to `registerIpc()`.

## Rules

- Never accept a file path, a URL, a shell command or a program name from the page. Take a record id, a key or a table id and look the real value up in main (`projects:open` takes an id and `"folder" | "editor" | "terminal"`; `projects:open-link` takes `"repo" | "site" | "docs"`; `links:open` takes a key of `brand.links`).
- Real work goes in `electron/features/` with a pure sibling that does not import `electron` (`projectsCore.ts`, `launchCore.ts`), tested in `tests/main/`.
- Results are plain data. Never return a path; return display text (`displayPath`) or an id.
- Only the main window's top frame may call a handler; `handle` enforces it.
- A request that a newer one replaces throws `supersededError()` (`shared/superseded.ts`); re-check your counter after every `await`, as `projectsScanRun.ts` does.
- If work can outlive the window (a dialog), check `getWindow()` after it.

## Checklist

- [ ] `pnpm typecheck && pnpm test` (`tests/ipc.test.ts` checks names and kinds)
- [ ] a wrong argument gets `Invalid argument #1: expected ...` and the app does not crash (`tests/validate.test.ts`)
- [ ] the page handles the error and the loading state
