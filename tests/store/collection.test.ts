import { describe, expect, it, vi } from "vitest";
import { createCollection, type CollectionIo } from "../../electron/store/collectionCore";
import { tasks } from "../../shared/collections/tasks";
import { notes } from "../../shared/collections/notes";

/** An in-memory io with a counter clock and sequential ids. */
function memory(initial?: unknown) {
  let t = 1000;
  let n = 0;
  const state = { file: initial as unknown, writes: 0, removed: 0 };
  const io: CollectionIo = {
    read: () => state.file,
    write: (e) => { state.file = JSON.parse(JSON.stringify(e)); state.writes++; },
    remove: () => { state.file = undefined; state.removed++; },
    now: () => ++t,
    newId: () => (++n).toString(16).padStart(16, "0"),
  };
  return { state, io };
}
const id = (n: number) => n.toString(16).padStart(16, "0");

describe("collection CRUD", () => {
  it("creates with defaults, id and timestamps, and persists the envelope", () => {
    const { io, state } = memory();
    const c = createCollection(tasks, io);
    const t = c.create({ title: "Buy milk", junk: 1 });
    expect(t).toEqual({ id: id(1), title: "Buy milk", done: false, due: null, createdAt: 1001, updatedAt: 1001 });
    expect(c.list()).toEqual([t]);
    expect(state.file).toEqual({ version: 1, items: [t] });
  });

  it("rejects input that heals to null", () => {
    const c = createCollection(tasks, memory().io);
    expect(() => c.create({ title: "  " })).toThrow("Invalid tasks record");
    expect(() => c.create("nope")).toThrow("Invalid tasks record");
    expect(c.list()).toEqual([]);
  });

  it("update heals the merged record and keeps id and createdAt", () => {
    const c = createCollection(tasks, memory().io);
    const t = c.create({ title: "a" });
    const u = c.update(t.id, { done: true, id: "ffffffffffffffff", createdAt: 5, title: "x".repeat(900) });
    expect(u.id).toBe(t.id);
    expect(u.createdAt).toBe(t.createdAt);
    expect(u.updatedAt).toBeGreaterThan(t.updatedAt);
    expect(u.done).toBe(true);
    expect(u.title).toHaveLength(500);
    expect(c.get(t.id)).toEqual(u);
  });

  it("update refuses unknown ids, non-object patches and patches that make the record unusable", () => {
    const c = createCollection(tasks, memory().io);
    const t = c.create({ title: "a" });
    expect(() => c.update(id(99), {})).toThrow("Not found");
    expect(() => c.update(t.id, "x")).toThrow("Invalid tasks record");
    expect(() => c.update(t.id, { title: "" })).toThrow("Invalid tasks record");
    expect(c.get(t.id)?.title).toBe("a");
  });

  it("remove returns the record and its index; restore puts it back there", () => {
    const c = createCollection(tasks, memory().io);
    const [a, b, d] = ["a", "b", "c"].map((title) => c.create({ title }));
    const removed = c.remove(b.id);
    expect(removed).toEqual({ record: b, index: 1 });
    expect(c.list().map((r) => r.id)).toEqual([a.id, d.id]);
    const back = c.restore(removed.record, removed.index);
    expect(back.id).toBe(b.id);
    expect(c.list().map((r) => r.id)).toEqual([a.id, b.id, d.id]);
    expect(() => c.remove(b.id) && c.remove(b.id)).toThrow("Not found");
  });

  it("restore gives a new id when the id is used or invalid, and clamps the index", () => {
    const c = createCollection(tasks, memory().io);
    const a = c.create({ title: "a" });
    const dup = c.restore({ ...a }, 99);
    expect(dup.id).not.toBe(a.id);
    expect(c.list().map((r) => r.id)).toEqual([a.id, dup.id]);
    const bad = c.restore({ id: "../etc", title: "z" }, -5);
    expect(bad.id).toMatch(/^[0-9a-f]{16}$/);
    expect(c.list()[0].id).toBe(bad.id);
    expect(() => c.restore(null, 0)).toThrow("Invalid tasks record");
  });

  it("reorder takes only a permutation of the current ids", () => {
    const c = createCollection(tasks, memory().io);
    const [a, b] = ["a", "b"].map((title) => c.create({ title }));
    c.reorder([b.id, a.id]);
    expect(c.list().map((r) => r.id)).toEqual([b.id, a.id]);
    expect(() => c.reorder([a.id])).toThrow();
    expect(() => c.reorder([a.id, a.id])).toThrow();
    expect(() => c.reorder([a.id, id(77)])).toThrow();
  });

  it("enforces the max-items cap on create and restore", () => {
    const small = { ...notes, max: 2 };
    const c = createCollection(small, memory().io);
    const first = c.create({ title: "1" });
    c.create({ title: "2" });
    expect(() => c.create({ title: "3" })).toThrow("Limit reached: 2 notes");
    expect(() => c.restore({ ...first }, 0)).toThrow("Limit reached: 2 notes");
    expect(c.list()).toHaveLength(2);
  });

  it("clear deletes the file and replaceAll heals every item", () => {
    const { io, state } = memory();
    const c = createCollection(tasks, io);
    c.create({ title: "a" });
    c.clear();
    expect(state.removed).toBe(1);
    expect(state.file).toBeUndefined();
    expect(c.list()).toEqual([]);
    c.replaceAll([{ title: "ok" }, { title: "" }, 4, null, { title: "also", done: "yes" }]);
    expect(c.list().map((r) => [r.title, r.done])).toEqual([["ok", false], ["also", false]]);
  });

  it("emits to listeners after each change until unsubscribed, and survives a throwing listener", () => {
    const c = createCollection(tasks, memory().io);
    const seen = vi.fn();
    c.onChange(() => { throw new Error("boom"); });
    const off = c.onChange(seen);
    const t = c.create({ title: "a" });
    c.update(t.id, { done: true });
    expect(seen).toHaveBeenCalledTimes(2);
    expect(seen.mock.calls[1][0][0].done).toBe(true);
    off();
    c.remove(t.id);
    expect(seen).toHaveBeenCalledTimes(2);
  });

});

describe("a failed write", () => {
  it("makes the mutation throw and leaves the in-memory state and listeners untouched", () => {
    const { io } = memory();
    let full = false;
    const c = createCollection(tasks, { ...io, write: (e) => { if (full) throw new Error("disk full"); io.write?.(e); } });
    const a = c.create({ title: "a" });
    const seen = vi.fn();
    c.onChange(seen);
    full = true;
    expect(() => c.create({ title: "b" })).toThrow("Could not save your tasks: disk full");
    expect(() => c.update(a.id, { done: true })).toThrow("disk full");
    expect(() => c.remove(a.id)).toThrow("disk full");
    expect(() => c.restore({ title: "z" }, 0)).toThrow("disk full");
    expect(() => c.reorder([a.id])).toThrow("disk full");
    expect(() => c.replaceAll([{ title: "x" }])).toThrow("disk full");
    expect(c.list()).toEqual([a]);
    expect(seen).not.toHaveBeenCalled();
  });

  it("clear throws when the file cannot be removed", () => {
    const c = createCollection(tasks, { ...memory().io, remove: () => { throw new Error("EACCES"); } });
    c.create({ title: "a" });
    expect(() => c.clear()).toThrow("EACCES");
    expect(c.list()).toHaveLength(1);
  });
});

describe("missing, damaged and newer files", () => {
  const rec = (n: number) => ({ id: id(n), title: `t${n}`, done: false, due: null, createdAt: 1, updatedAt: 2 });

  it("a missing file is empty and nothing is quarantined", () => {
    const quarantine = vi.fn();
    const c = createCollection(tasks, { ...memory().io, quarantine });
    c.create({ title: "a" });
    expect(quarantine).not.toHaveBeenCalled();
  });

  it("a damaged file is moved aside once, before the first write, then the collection carries on empty", () => {
    for (const raw of [null, 5, "x", [], {}, { version: 1 }, { version: 1, items: "no" }, { version: "1", items: [] }]) {
      const { io, state } = memory(raw);
      const order: string[] = [];
      const c = createCollection(tasks, {
        ...io,
        quarantine: () => { order.push("quarantine"); },
        write: (e) => { order.push("write"); io.write?.(e); },
      });
      expect(c.list(), JSON.stringify(raw)).toEqual([]);
      expect(order).toEqual([]);                    // reading alone changes nothing
      c.create({ title: "a" });
      c.create({ title: "b" });
      expect(order, JSON.stringify(raw)).toEqual(["quarantine", "write", "write"]);
      expect(state.writes).toBe(2);
    }
  });

  it("an unreadable file (read throws) is treated as damaged", () => {
    const quarantine = vi.fn();
    const c = createCollection(tasks, { read: () => { throw new SyntaxError("bad json"); }, write: () => {}, quarantine });
    expect(c.list()).toEqual([]);
    c.create({ title: "a" });
    expect(quarantine).toHaveBeenCalledTimes(1);
  });

  it("when the file cannot be moved aside, the write is refused and the file is not replaced", () => {
    const { io, state } = memory("garbage");
    const c = createCollection(tasks, { ...io, quarantine: () => { throw new Error("EPERM"); } });
    expect(() => c.create({ title: "a" })).toThrow("EPERM");
    expect(state.writes).toBe(0);
    expect(state.file).toBe("garbage");
    expect(c.list()).toEqual([]);
  });

  it("a file from a newer version is read-only: every operation throws and nothing is written or moved", () => {
    const { io, state } = memory({ version: 2, items: [rec(1)] });
    const quarantine = vi.fn();
    const c = createCollection(tasks, { ...io, quarantine });
    const msg = "These tasks were saved by a newer version of the app. Update the app to open them.";
    expect(() => c.list()).toThrow(msg);
    expect(() => c.get(id(1))).toThrow(msg);
    expect(() => c.create({ title: "a" })).toThrow(msg);
    expect(() => c.update(id(1), {})).toThrow(msg);
    expect(() => c.remove(id(1))).toThrow(msg);
    expect(() => c.restore(rec(1), 0)).toThrow(msg);
    expect(() => c.reorder([])).toThrow(msg);
    expect(() => c.replaceAll([])).toThrow(msg);
    expect(state.writes).toBe(0);
    expect(state.file).toEqual({ version: 2, items: [rec(1)] });
    expect(quarantine).not.toHaveBeenCalled();
  });

  it("an explicit clear (reset) lifts the read-only state", () => {
    const c = createCollection(tasks, memory({ version: 2, items: [rec(1)] }).io);
    c.clear();
    expect(c.list()).toEqual([]);
    expect(c.create({ title: "a" }).title).toBe("a");
  });
});

describe("collection loading", () => {
  const rec = (n: number, extra = {}) => ({ id: id(n), title: `t${n}`, done: false, due: null, createdAt: 1, updatedAt: 2, ...extra });

  it("reads a valid file as is", () => {
    const c = createCollection(tasks, memory({ version: 1, items: [rec(1), rec(2)] }).io);
    expect(c.list()).toEqual([rec(1), rec(2)]);
  });

  it("garbage reads as empty", () => {
    for (const raw of [undefined, null, 5, "x", [], {}, { version: 1 }, { version: 1, items: "no" }, { version: "1", items: [rec(1)] }]) {
      expect(createCollection(tasks, memory(raw).io).list(), JSON.stringify(raw)).toEqual([]);
    }
  });

  it("a throwing read reads as empty", () => {
    const c = createCollection(tasks, { read: () => { throw new Error("EACCES"); } });
    expect(c.list()).toEqual([]);
  });

  it("an older version envelope is still healed", () => {
    expect(createCollection(tasks, memory({ version: 0, items: [rec(1)] }).io).list()).toEqual([rec(1)]);
  });

  it("heals bad items: drops unusable, fixes bad ids and timestamps, dedupes ids, applies the cap", () => {
    const raw = {
      version: 1,
      items: [rec(1), rec(1, { title: "dup id" }), { ...rec(3), id: "bad", createdAt: "x", updatedAt: NaN }, { title: "" }, 7, rec(5, { due: "2025-13-40", extra: 1 })],
    };
    const list = createCollection(tasks, memory(raw).io).list();
    expect(list.map((r) => r.title)).toEqual(["t1", "dup id", "t3", "t5"]);
    expect(new Set(list.map((r) => r.id)).size).toBe(4);
    for (const r of list) {
      expect(r.id).toMatch(/^[0-9a-f]{16}$/);
      expect(Number.isFinite(r.createdAt) && Number.isFinite(r.updatedAt)).toBe(true);
    }
    expect(list[3].due).toBeNull();
    expect(list[3]).not.toHaveProperty("extra");

    const capped = createCollection({ ...tasks, max: 2 }, memory({ version: 1, items: [rec(1), rec(2), rec(3)] }).io);
    expect(capped.list()).toHaveLength(2);
  });
});
