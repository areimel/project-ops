import { describe, expect, it } from "vitest";
import { COMMAND_ID } from "../shared/commands";
import { APPS } from "../renderer/apps/registry";
import { activeCommands } from "../renderer/shell/commandTable";

describe("app registry", () => {
  it("has the eight demos in sheet order", () => {
    expect(APPS.map((a) => a.id)).toEqual(["notes", "tasks", "editor", "clipboard", "timer", "system", "news", "player"]);
  });
  it("has unique ids, a valid shape, a name and a summary", () => {
    expect(new Set(APPS.map((a) => a.id)).size).toBe(APPS.length);
    for (const a of APPS) {
      expect(a.id).toMatch(/^[a-z][a-z0-9-]{0,31}$/);
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.summary.length).toBeGreaterThan(0);
      expect(a.icon).toBeTruthy();
      expect(a.component).toBeTruthy();
    }
  });
  it("gives every command the app's prefix and a valid id", () => {
    for (const a of APPS) {
      for (const c of a.commands ?? []) {
        expect(c.id.startsWith(`${a.id}.`), `${c.id} must start with ${a.id}.`).toBe(true);
        expect(c.id).toMatch(COMMAND_ID);
        expect(c.label.length).toBeLessThanOrEqual(60);
      }
    }
  });
  it("keeps every active command set free of duplicate ids and duplicate keys", () => {
    for (const a of APPS) {
      const all = activeCommands(a, APPS);
      const ids = all.map((c) => c.id);
      expect(new Set(ids).size, `${a.id}: ids`).toBe(ids.length);
      const keys = all.flatMap((c) => c.keys ?? []);
      expect(new Set(keys).size, `${a.id}: keys`).toBe(keys.length);
      const accels = all.flatMap((c) => (c.accelerator ? [c.accelerator] : []));
      expect(new Set(accels).size, `${a.id}: accelerators`).toBe(accels.length);
    }
  });
  it("stays within what the native menu accepts", () => {
    expect(APPS.length).toBeLessThanOrEqual(20);
    for (const a of APPS) expect((a.commands ?? []).length).toBeLessThanOrEqual(30);
  });
});
