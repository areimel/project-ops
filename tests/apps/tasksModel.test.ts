import { describe, expect, it } from "vitest";
import type { Task } from "../../shared/collections/tasks";
import { formatDue, isOverdue, moveId, moveVisible, taskCounts, visibleTasks } from "../../renderer/apps/tasks/tasksModel";

const t = (id: string, done: boolean, due: string | null = null): Task => ({ id, title: id, done, due, createdAt: 0, updatedAt: 0 });
const list = [t("a", false), t("b", true), t("c", false), t("d", true)];

describe("visibleTasks and taskCounts", () => {
  it("filters and keeps order", () => {
    expect(visibleTasks(list, "all").map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
    expect(visibleTasks(list, "active").map((x) => x.id)).toEqual(["a", "c"]);
    expect(visibleTasks(list, "done").map((x) => x.id)).toEqual(["b", "d"]);
  });
  it("counts", () => {
    expect(taskCounts(list)).toEqual({ all: 4, active: 2, done: 2 });
    expect(taskCounts([])).toEqual({ all: 0, active: 0, done: 0 });
  });
});

describe("moveId", () => {
  const ids = ["a", "b", "c"];
  it("moves up and down", () => {
    expect(moveId(ids, "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveId(ids, "b", 1)).toEqual(["a", "c", "b"]);
  });
  it("clamps at the ends and ignores unknown ids", () => {
    expect(moveId(ids, "a", -1)).toEqual(ids);
    expect(moveId(ids, "c", 5)).toEqual(ids);
    expect(moveId(ids, "x", 1)).toEqual(ids);
  });
  it("does not change its input", () => {
    moveId(ids, "a", 2);
    expect(ids).toEqual(["a", "b", "c"]);
  });
});

describe("moveVisible", () => {
  const all = ["a", "b", "c", "d"];
  it("jumps over hidden tasks", () => {
    expect(moveVisible(all, ["a", "c"], "c", -1)).toEqual(["c", "a", "b", "d"]);
    expect(moveVisible(all, ["a", "c"], "a", 1)).toEqual(["b", "c", "a", "d"]);
  });
  it("does nothing at the edge of the visible list", () => {
    expect(moveVisible(all, ["a", "c"], "a", -1)).toEqual(all);
    expect(moveVisible(all, ["a", "c"], "c", 1)).toEqual(all);
  });
});

describe("dates", () => {
  const now = new Date(2026, 10, 17);
  it("flags only open tasks due before today", () => {
    expect(isOverdue(t("x", false, "2026-11-16"), now)).toBe(true);
    expect(isOverdue(t("x", false, "2026-11-17"), now)).toBe(false);
    expect(isOverdue(t("x", true, "2026-11-01"), now)).toBe(false);
    expect(isOverdue(t("x", false, null), now)).toBe(false);
  });
  it("shows the year only when it is not this year", () => {
    expect(formatDue("2026-03-09", now)).not.toMatch(/2026/);
    expect(formatDue("2025-03-09", now)).toMatch(/2025/);
  });
});
