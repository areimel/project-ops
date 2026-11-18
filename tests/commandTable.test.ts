import { describe, expect, it } from "vitest";
import { SHELL_COMMANDS } from "../shared/commands";
import type { AppDefinition } from "../renderer/apps/types";
import { activeCommands, helpGroups, hintFor, keyFor, menuContext } from "../renderer/shell/commandTable";

const app = (id: string, commands: AppDefinition["commands"] = []): AppDefinition =>
  ({ id, name: id[0].toUpperCase() + id.slice(1), icon: "notes", summary: "", component: null as never, commands });
const notes = app("notes", [
  { id: "notes.new", label: "New note", group: "Notes", keys: ["n"] },
  { id: "notes.pin", label: "Pin note", group: "Notes" },
]);
const apps = [notes, app("tasks")];

describe("activeCommands", () => {
  it("is shell, then go, then the active app", () => {
    const ids = activeCommands(notes, apps).map((c) => c.id);
    expect(ids).toEqual([...SHELL_COMMANDS.map((c) => c.id), "go.notes", "go.tasks", "notes.new", "notes.pin"]);
  });
  it("has no app commands on home or settings", () => {
    expect(activeCommands(null, apps).some((c) => c.id.startsWith("notes."))).toBe(false);
  });
  it("has unique ids", () => {
    const ids = activeCommands(notes, apps).map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("menuContext", () => {
  it("lists apps in order and the active app's commands", () => {
    const ctx = menuContext(notes, apps);
    expect(ctx.apps).toEqual([{ id: "notes", name: "Notes" }, { id: "tasks", name: "Tasks" }]);
    expect(ctx.app?.name).toBe("Notes");
    expect(ctx.app?.commands).toHaveLength(2);
  });
  it("has no app on home", () => { expect(menuContext(null, apps).app).toBeNull(); });
  it("stays within the limits main accepts", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ id: `big.c${i}`, label: "x", group: "Big" }));
    expect(menuContext(app("big", many), apps).app?.commands).toHaveLength(30);
    expect(menuContext(null, Array.from({ length: 25 }, (_, i) => app(`a${i}`))).apps).toHaveLength(20);
  });
});

describe("helpGroups", () => {
  it("keeps shell groups first, then app groups, and skips commands without keys", () => {
    const groups = helpGroups(activeCommands(notes, apps));
    expect(groups.map((g) => g.name)).toEqual(["File", "View", "Go", "Help", "Notes"]);
    expect(groups.at(-1)?.rows.map((r) => r.id)).toEqual(["notes.new"]);
  });
});

describe("hintFor", () => {
  it("adds the key to the label", () => {
    expect(hintFor(activeCommands(null, apps), "shell.palette", false)).toBe("Command palette (Ctrl+K)");
    expect(hintFor(activeCommands(null, apps), "go.tasks", true)).toBe("Go to Tasks (⌘2)");
  });
});

describe("keyFor", () => {
  const cmds = activeCommands(notes, apps);
  it("gives the first key or accelerator as the table spells it", () => {
    expect(keyFor(cmds, "shell.palette")).toBe("CmdOrCtrl+K");
    expect(keyFor(cmds, "notes.new")).toBe("n");
  });
  it("is undefined for a command without one, or an unknown id", () => {
    expect(keyFor(cmds, "notes.pin")).toBeUndefined();
    expect(keyFor(cmds, "nope.nope")).toBeUndefined();
  });
});
