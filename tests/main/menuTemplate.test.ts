import type { MenuItemConstructorOptions } from "electron";
import { describe, expect, it, vi } from "vitest";
import type { CommandSpec, MenuContext } from "../../shared/commands";
import { ACCELERATOR, MAX_APPS, MAX_APP_COMMANDS, MAX_LABEL, buildTemplate, menuAccelerator, sanitizeMenuContext } from "../../electron/menuTemplate";

const apps = [{ id: "notes", name: "Notes" }, { id: "tasks", name: "Tasks" }];
const cmd = (over: Partial<CommandSpec> = {}): CommandSpec => ({ id: "notes.new", label: "New note", group: "Notes", ...over });

const build = (context: MenuContext, o: { mac?: boolean; dev?: boolean } = {}) => {
  const send = vi.fn(); const openLink = vi.fn();
  return { send, openLink, tpl: buildTemplate({ mac: !!o.mac, dev: !!o.dev, context, send, openLink }) };
};
const sub = (tpl: MenuItemConstructorOptions[], label: string): MenuItemConstructorOptions[] =>
  (tpl.find((m) => m.label === label)?.submenu ?? []) as MenuItemConstructorOptions[];

describe("sanitizeMenuContext", () => {
  it("passes a valid context through", () => {
    const ctx = { apps, app: { name: "Notes", commands: [cmd({ accelerator: "CmdOrCtrl+N" }), cmd({ id: "notes.pin", label: "Pin", keys: ["p"] })] } };
    expect(sanitizeMenuContext(ctx)).toEqual(ctx);
  });
  it("throws on a malformed structure", () => {
    for (const bad of [null, "x", [], {}, { apps: "no" }, { apps: [], app: { name: "x" } }, { apps: [], app: "x" }]) {
      expect(() => sanitizeMenuContext(bad)).toThrow();
    }
  });
  it("drops items with bad ids, empty or long labels, control characters", () => {
    const out = sanitizeMenuContext({
      apps: [{ id: "Bad", name: "x" }, { id: "ok", name: "" }, { id: "ok", name: "a".repeat(MAX_LABEL + 1) }, { id: "fine", name: "Fine" }, 7],
      app: { name: "Notes", commands: [cmd({ id: "BAD ID" }), cmd({ label: "x\u0000y" }), cmd({ label: "a".repeat(MAX_LABEL + 1) }), cmd({ group: "" }), cmd()] },
    });
    expect(out.apps).toEqual([{ id: "fine", name: "Fine" }]);
    expect(out.app?.commands).toEqual([cmd()]);
  });
  it("caps counts", () => {
    const many = Array.from({ length: 80 }, (_, i) => ({ id: `app${i}`, name: `App ${i}` }));
    const commands = Array.from({ length: 80 }, (_, i) => cmd({ id: `notes.c${i}` }));
    const out = sanitizeMenuContext({ apps: many, app: { name: "N", commands } });
    expect(out.apps).toHaveLength(MAX_APPS);
    expect(out.app?.commands).toHaveLength(MAX_APP_COMMANDS);
  });
  it("drops accelerators outside the toAccelerator form and unknown fields", () => {
    const out = sanitizeMenuContext({ apps: [], app: { name: "N", commands: [
      { ...cmd({ accelerator: "Super+Q" }), extra: "x" }, cmd({ id: "notes.b", accelerator: "CmdOrCtrl+Shift+Alt+Ctrl+X" }),
      cmd({ id: "notes.c", accelerator: "CmdOrCtrl+" }), cmd({ id: "notes.d", accelerator: "ctrl+n" }),
    ] } });
    expect(out.app?.commands.map((c) => c.accelerator)).toEqual([undefined, undefined, undefined, undefined]);
    expect(out.app?.commands[0]).not.toHaveProperty("extra");
  });
});

describe("menuAccelerator", () => {
  it("accepts toAccelerator-form chords and fires the menu", () => {
    for (const a of ["CmdOrCtrl+N", "CmdOrCtrl+Shift+S", "F11", "CmdOrCtrl+,", "Alt+/", "Ctrl+1"]) {
      expect(ACCELERATOR.test(a)).toBe(true);
      expect(menuAccelerator(cmd({ accelerator: a }))).toEqual({ accelerator: a, registerAccelerator: true });
    }
  });
  it("shows renderer-handled keys without registering them", () => {
    expect(menuAccelerator(cmd({ keys: ["n"] }))).toEqual({ accelerator: "N", registerAccelerator: false });
    expect(menuAccelerator(cmd({ keys: ["?"] }))).toEqual({ accelerator: "Shift+/", registerAccelerator: false });
    expect(menuAccelerator(cmd({ keys: [" "] }))?.accelerator).toBe("Space");
    expect(menuAccelerator(cmd({ keys: ["Delete"] }))?.accelerator).toBe("Delete");
    expect(menuAccelerator(cmd({ keys: ["Shift+E"] }))?.accelerator).toBe("Shift+E");
  });
  it("returns null for nothing usable", () => {
    expect(menuAccelerator(cmd())).toBeNull();
    expect(menuAccelerator(cmd({ keys: ["Weird"] }))).toBeNull();
  });
});

describe("buildTemplate", () => {
  const ctx: MenuContext = { apps, app: { name: "Notes", commands: [cmd({ accelerator: "CmdOrCtrl+N" }), cmd({ id: "notes.hid", label: "Hidden", menu: false })] } };

  it("orders the menus and adds the app menu from the context", () => {
    const { tpl } = build(ctx);
    expect(tpl.map((m) => m.label ?? m.role)).toEqual(["File", "editMenu", "View", "Go", "Notes", "windowMenu", "Help"]);
    expect(build({ apps, app: null }).tpl.some((m) => m.label === "Notes")).toBe(false);
  });
  it("puts the macOS app menu first, and quit in File only off macOS", () => {
    const mac = build(ctx, { mac: true }).tpl;
    expect(mac[0]).toEqual({ role: "appMenu" });
    expect(sub(mac, "File").some((i) => i.role === "quit")).toBe(false);
    expect(sub(build(ctx).tpl, "File").some((i) => i.role === "quit")).toBe(true);
    expect(build(ctx).tpl[0].role).not.toBe("appMenu");
  });
  it("builds the Go menu from the registry and routes clicks to menu:command", () => {
    const { tpl, send } = build(ctx);
    const go = sub(tpl, "Go");
    const notes = go.find((i) => i.label === "Go to Notes");
    expect(notes?.accelerator).toBe("CmdOrCtrl+1");
    (notes?.click as () => void)();
    expect(send).toHaveBeenCalledWith("go.notes");
    expect(go.find((i) => i.label === "Go to Tasks")?.accelerator).toBe("CmdOrCtrl+2");
  });
  it("skips commands with menu: false and keeps shell accelerators", () => {
    const { tpl } = build(ctx);
    expect(sub(tpl, "Notes").map((i) => i.label)).toEqual(["New note"]);
    expect(sub(tpl, "View").find((i) => i.label === "Command palette")?.accelerator).toBe("CmdOrCtrl+K");
  });
  it("registers chords but not renderer keys, and drops a repeated accelerator", () => {
    const { tpl } = build({ apps, app: { name: "N", commands: [
      cmd({ keys: ["n"] }), cmd({ id: "notes.k", label: "Palette too", accelerator: "CmdOrCtrl+K" }),
    ] } });
    const items = sub(tpl, "N");
    expect(items[0]).toMatchObject({ accelerator: "N", registerAccelerator: false });
    expect(items[1].accelerator).toBeUndefined();
  });
  it("adds reload and devtools only in dev", () => {
    expect(sub(build(ctx, { dev: true }).tpl, "View").map((i) => i.role)).toEqual(expect.arrayContaining(["reload", "toggleDevTools"]));
    expect(sub(build(ctx).tpl, "View").some((i) => i.role === "toggleDevTools")).toBe(false);
  });
  it("Help links go through openLink with fixed keys", () => {
    const { tpl, openLink } = build(ctx);
    for (const i of sub(tpl, "Help")) if (i.label === "Website") (i.click as () => void)();
    expect(openLink).toHaveBeenCalledWith("website");
  });
});
