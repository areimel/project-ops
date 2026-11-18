import { describe, expect, it } from "vitest";
import { COMMAND_ID, SHELL_COMMANDS, SHELL_GROUPS, formatKey, goCommands, hint, keysOf, parseKey, toAccelerator } from "../shared/commands";

describe("commands table", () => {
  it("has unique ids that match COMMAND_ID", () => {
    const ids = SHELL_COMMANDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(COMMAND_ID);
  });
  it("every key and accelerator parses and formats", () => {
    for (const c of SHELL_COMMANDS) {
      for (const k of keysOf(c)) {
        expect(parseKey(k).key.length).toBeGreaterThan(0);
        expect(formatKey(k, false)).not.toBe("");
        expect(toAccelerator(k)).toBeTruthy();
      }
    }
  });
});

describe("formatKey", () => {
  it("formats non-mac", () => {
    expect(formatKey("CmdOrCtrl+O", false)).toBe("Ctrl+O");
    expect(formatKey(" ", false)).toBe("Space");
    expect(formatKey("ArrowLeft", false)).toBe("←");
    expect(formatKey("Shift+E", false)).toBe("Shift+E");
    expect(formatKey("?", false)).toBe("?");
  });
  it("formats mac", () => {
    expect(formatKey("CmdOrCtrl+O", true)).toBe("⌘O");
    expect(formatKey("CmdOrCtrl+Shift+S", true)).toBe("⌘⇧S");
  });
});

describe("helpers", () => {
  it("hint prefers key then accelerator", () => {
    expect(hint({ id: "x.a", label: "Shortcuts", group: "G", keys: ["?"] }, false)).toBe("Shortcuts (?)");
    expect(hint({ id: "x.b", label: "Palette", group: "G", accelerator: "CmdOrCtrl+K" }, false)).toBe("Palette (Ctrl+K)");
  });
  it("goCommands numbers apps from 1", () => {
    const go = goCommands([{ id: "notes", name: "Notes" }, { id: "tasks", name: "Tasks" }]);
    expect(go.map((c) => c.id)).toEqual(["go.notes", "go.tasks"]);
    expect(go[1].accelerator).toBe("CmdOrCtrl+2");
  });
  it("goCommands covers at most the nine accelerators CmdOrCtrl+1..9", () => {
    const go = goCommands(Array.from({ length: 12 }, (_, i) => ({ id: `a${i}`, name: `A${i}` })));
    expect(go).toHaveLength(9);
    expect(go[8].accelerator).toBe("CmdOrCtrl+9");
    for (const c of go) expect(c.id).toMatch(COMMAND_ID);
  });
});

describe("shell commands", () => {
  it("have unique accelerators and a declared group", () => {
    const accels = SHELL_COMMANDS.flatMap((c) => (c.accelerator ? [c.accelerator] : []));
    expect(new Set(accels).size).toBe(accels.length);
    for (const c of SHELL_COMMANDS) expect(SHELL_GROUPS).toContain(c.group);
  });
  it("each have a key or accelerator, so each shows in the help", () => {
    for (const c of SHELL_COMMANDS) expect(keysOf(c).length).toBeGreaterThan(0);
  });
  it("parse a trailing plus and map arrows to accelerators", () => {
    expect(parseKey("CmdOrCtrl++")).toEqual({ mods: ["CmdOrCtrl"], key: "+" });
    expect(toAccelerator("ArrowLeft")).toBe("Left");
    expect(toAccelerator("?")).toBe("Shift+/");
  });
});
