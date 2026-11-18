import { describe, expect, it } from "vitest";
import type { CommandSpec } from "../shared/commands";
import { commandForKey, ignoresKey, type KeyTarget } from "../renderer/hooks/useShortcuts";

const cmd = (id: string, keys: string[]): CommandSpec => ({ id, label: id, group: "Test", keys });
const COMMANDS = [cmd("play", [" "]), cmd("open", ["Enter"]), cmd("fs", ["f"]), cmd("help", ["?"]), cmd("big", ["Shift+F"])];

const key = (k: string, mods: Partial<Record<"metaKey" | "ctrlKey" | "altKey" | "shiftKey", boolean>> = {}) =>
  ({ key: k, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...mods });
/** A fake element: `inside` lists the selector fragments it counts as matching. */
const el = (tagName: string, inside: string[] = [], editable = false): KeyTarget => ({
  tagName, isContentEditable: editable, closest: (sel) => (inside.some((s) => sel.includes(s)) ? {} : null),
});

describe("commandForKey", () => {
  it("matches plain keys, case-insensitively", () => {
    expect(commandForKey(COMMANDS, key(" "))).toBe("play");
    expect(commandForKey(COMMANDS, key("F"))).toBe("fs");
    expect(commandForKey(COMMANDS, key("x"))).toBeUndefined();
  });
  it("matches a shifted letter only with shift, and a symbol regardless of shift", () => {
    expect(commandForKey(COMMANDS, key("F", { shiftKey: true }))).toBe("big");
    expect(commandForKey([cmd("big", ["Shift+F"])], key("f"))).toBeUndefined();
    expect(commandForKey(COMMANDS, key("?"))).toBe("help");
    expect(commandForKey(COMMANDS, key("?", { shiftKey: true }))).toBe("help");
  });
});

describe("ignoresKey", () => {
  it("lets a command through when nothing is focused or the body is", () => {
    expect(ignoresKey(key(" "), null)).toBe(false);
    expect(ignoresKey(key(" "), el("BODY"))).toBe(false);
  });
  it("leaves Space and Enter to a focused button, link or role control", () => {
    for (const k of [" ", "Enter"]) {
      expect(ignoresKey(key(k), el("BUTTON", ["button"]))).toBe(true);
      expect(ignoresKey(key(k), el("SPAN", ['[role="switch"]']))).toBe(true);
      expect(ignoresKey(key(k), el("A", ["a[href]"]))).toBe(true);
    }
  });
  it("still lets other keys through while a button has focus", () => {
    expect(ignoresKey(key("f"), el("BUTTON", ["button"]))).toBe(false);
  });
  it("leaves every key to text fields and editable content", () => {
    for (const t of [el("INPUT"), el("TEXTAREA"), el("SELECT"), el("DIV", [], true)]) expect(ignoresKey(key("f"), t)).toBe(true);
  });
  it("ignores modifier chords", () => {
    for (const m of ["metaKey", "ctrlKey", "altKey"] as const) expect(ignoresKey(key("f", { [m]: true }), el("BODY"))).toBe(true);
  });
});
