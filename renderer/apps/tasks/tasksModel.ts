// Pure task logic: no React, no Electron, so vitest can test it directly.
import type { Task } from "../../../shared/collections/tasks";

export type TaskFilter = "all" | "active" | "done";

export function visibleTasks(tasks: readonly Task[], filter: TaskFilter): Task[] {
  if (filter === "all") return [...tasks];
  return tasks.filter((t) => t.done === (filter === "done"));
}

export function taskCounts(tasks: readonly Task[]): { all: number; active: number; done: number } {
  const done = tasks.filter((t) => t.done).length;
  return { all: tasks.length, active: tasks.length - done, done };
}

/** Moves `id` by `delta` places (clamped to the ends). Returns a new array; an unknown id changes nothing. */
export function moveId(ids: readonly string[], id: string, delta: number): string[] {
  const from = ids.indexOf(id);
  if (from < 0) return [...ids];
  const to = Math.min(ids.length - 1, Math.max(0, from + delta));
  const next = ids.filter((x) => x !== id);
  next.splice(to, 0, id);
  return next;
}

/**
 * New full order after moving a task one place up or down within what is on screen. While a filter hides
 * some tasks, "one place" means past the next visible one, so the move is always visible.
 */
export function moveVisible(all: readonly string[], visible: readonly string[], id: string, dir: -1 | 1): string[] {
  const neighbour = visible[visible.indexOf(id) + dir];
  if (neighbour === undefined) return [...all];
  return moveId(all, id, all.indexOf(neighbour) - all.indexOf(id));
}

/** "2026-03-09" as a short local date, e.g. "9 Mar". The year is shown only when it is not the current one. */
export function formatDue(due: string, now: Date = new Date()): string {
  const [y, m, d] = due.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", ...(y === now.getFullYear() ? {} : { year: "numeric" }) });
}

/** Overdue means an open task whose due day is before today. Dates are YYYY-MM-DD, so strings compare correctly. */
export function isOverdue(task: Pick<Task, "done" | "due">, now: Date = new Date()): boolean {
  if (task.done || !task.due) return false;
  const pad = (n: number) => String(n).padStart(2, "0");
  return task.due < `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
