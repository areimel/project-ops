import { describe, expect, it } from "vitest";
import type { CommandSpec } from "../shared/commands";
import { filterCommands } from "../renderer/shell/paletteFilter";

const cmds: CommandSpec[] = [
  { id: "notes.new", label: "New note", group: "Notes" },
  { id: "shell.settings", label: "Open settings", group: "File" },
  { id: "go.notes", label: "Go to Notes", group: "Go" },
  { id: "shell.palette", label: "Command palette", group: "View" },
  { id: "tasks.hidden", label: "Hidden task command", group: "Tasks", palette: false },
];
const ids = (q: string) => filterCommands(q, cmds).map((c) => c.id);

describe("filterCommands", () => {
  it("returns everything for an empty query, shell commands first, minus palette:false", () => {
    expect(ids("")).toEqual(["shell.settings", "shell.palette", "notes.new", "go.notes"]);
    expect(ids("   ")).toEqual(ids(""));
  });
  it("matches word prefixes of the label", () => {
    expect(ids("set")).toEqual(["shell.settings"]);
    expect(ids("new no")).toEqual(["notes.new"]);
  });
  it("does not match the middle of a word", () => {
    expect(ids("ettings")).toEqual([]);
  });
  it("matches the group name too", () => {
    expect(ids("view")).toEqual(["shell.palette"]);
    expect(ids("go")).toEqual(["go.notes"]);
  });
  it("is case-insensitive and needs every word", () => {
    expect(ids("NOTES")).toEqual(["notes.new", "go.notes"]);
    expect(ids("notes settings")).toEqual([]);
  });
  it("keeps shell commands ahead of the rest of the matches", () => {
    const list: CommandSpec[] = [
      { id: "app.open", label: "Open file", group: "App" },
      { id: "shell.open", label: "Open settings", group: "File" },
    ];
    expect(filterCommands("open", list).map((c) => c.id)).toEqual(["shell.open", "app.open"]);
  });
  it("never lists a palette:false command", () => {
    expect(ids("hidden")).toEqual([]);
  });
});
