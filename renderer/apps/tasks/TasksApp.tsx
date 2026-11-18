import { useRef, useState } from "react";
import type { Task } from "../../../shared/collections/tasks";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { IconButton } from "../../components/common/IconButton";
import { List, ListRow } from "../../components/common/List";
import { Segmented } from "../../components/common/Segmented";
import { Spinner } from "../../components/common/Spinner";
import { TextField } from "../../components/common/TextField";
import { useCollection } from "../../hooks/useCollection";
import { useCommandHandlers, useShell, useTitleInfo } from "../../shell/ShellContext";
import { errorMessage } from "../../utils/errorMessage";
import { formatDue, isOverdue, moveVisible, taskCounts, visibleTasks, type TaskFilter } from "./tasksModel";
import "./tasks.css";


export default function TasksApp() {
  const { items, status, error, reload, create, update, remove, restore, reorder } = useCollection("tasks");
  const { toast, confirm } = useShell();
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const titleInput = useRef<HTMLInputElement>(null);

  const counts = taskCounts(items);
  const visible = visibleTasks(items, filter);
  useTitleInfo({ count: `${counts.active} open` });

  // Every write goes through here: a failure becomes a toast that says what happened.
  async function attempt(what: string, work: () => Promise<unknown>): Promise<boolean> {
    try { await work(); return true; } catch (e) {
      toast("error", `Could not ${what}. ${errorMessage(e)}`);
      return false;
    }
  }

  const focusAdd = () => titleInput.current?.focus();

  async function add() {
    if (title.trim() === "") { focusAdd(); return; }
    if (await attempt("add the task", () => create({ title: title.trim(), due: due || null }))) {
      setTitle("");
      setDue("");
      focusAdd();
    }
  }

  async function delete_(task: Task) {
    try {
      const removed = await remove(task.id);
      // `removed` remembers the record and its position, so Undo puts it back where it was.
      toast("info", "Task deleted", { label: "Undo", run: () => void attempt("restore the task", () => restore(removed)) });
    } catch (e) {
      toast("error", `Could not delete the task. ${errorMessage(e)}`);
    }
  }

  async function clearDone() {
    if (counts.done === 0) { toast("info", "No finished tasks to clear."); return; }
    const ok = await confirm({
      title: "Clear finished tasks?", body: `This deletes ${counts.done} finished ${counts.done === 1 ? "task" : "tasks"}. It cannot be undone.`,
      confirmLabel: "Clear finished", danger: true,
    });
    if (!ok) return;
    // The store has no batch delete, so remove one by one; a failure stops and says how far it got.
    for (const t of items.filter((x) => x.done)) {
      if (!(await attempt("clear all finished tasks", () => remove(t.id)))) return;
    }
    toast("success", "Finished tasks cleared");
  }

  useCommandHandlers({
    "tasks.new": focusAdd,
    "tasks.clearDone": () => void clearDone(),
    "tasks.filterAll": () => setFilter("all"),
    "tasks.filterActive": () => setFilter("active"),
    "tasks.filterDone": () => setFilter("done"),
  });

  if (status === "loading") return <div className="app-root tasks tasks-center"><Spinner label="Loading tasks" /></div>;
  if (status === "error") {
    return (
      <div className="app-root tasks tasks-center">
        <EmptyState icon="warning" title="Tasks could not be loaded"
          body={error ?? "The file could not be read."} action={<Button onClick={reload}>Try again</Button>} />
      </div>
    );
  }

  const move = (t: Task, dir: -1 | 1) => attempt("move the task", () =>
    reorder(moveVisible(items.map((x) => x.id), visible.map((x) => x.id), t.id, dir)));

  return (
    <div className="app-root tasks">
      <form className="tasks-add" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <TextField ref={titleInput} className="tasks-add-title" label="New task" hideLabel placeholder="What needs doing?"
          maxLength={500} value={title} onChange={setTitle} />
        <TextField className="tasks-add-due" type="date" label="Due date (optional)" hideLabel value={due} onChange={setDue} />
        <Button type="submit" icon="plus">Add task</Button>
      </form>

      <div className="tasks-bar">
        <Segmented label="Show tasks" value={filter} onChange={setFilter} options={[
          { value: "all", label: `All ${counts.all}` },
          { value: "active", label: `Active ${counts.active}` },
          { value: "done", label: `Done ${counts.done}` },
        ]} />
        <Button variant="quiet" className="tasks-clear" onClick={() => void clearDone()} disabled={counts.done === 0}>Clear finished</Button>
      </div>

      <div className="tasks-body">
        {items.length === 0 ? (
          <EmptyState icon="tasks" title="Add your first task" body="Type what needs doing and press Enter. Tasks are saved on this computer."
            action={<Button onClick={focusAdd}>Add a task</Button>} />
        ) : visible.length === 0 ? (
          <EmptyState title={filter === "active" ? "All done" : "Nothing finished yet"}
            body={filter === "active" ? "Every task is checked off." : "Check a task off and it shows up here."} />
        ) : (
          <List label="Tasks">
            {visible.map((t, i) => (
              <ListRow key={t.id} title={<span className={t.done ? "task-done" : ""}>{t.title}</span>}
                leading={<input type="checkbox" className="checkbox" checked={t.done} aria-label={`Done: ${t.title}`}
                  onChange={(e) => void attempt("update the task", () => update(t.id, { done: e.target.checked }))} />}
                meta={t.due && <span className={isOverdue(t) ? "task-overdue" : ""}>{isOverdue(t) ? "Overdue, " : "Due "}{formatDue(t.due)}</span>}
                trailing={<>
                  <IconButton icon="chevronUp" label="Move up" disabled={i === 0} onClick={() => void move(t, -1)} />
                  <IconButton icon="chevronDown" label="Move down" disabled={i === visible.length - 1} onClick={() => void move(t, 1)} />
                  <IconButton icon="trash" label="Delete task" onClick={() => void delete_(t)} />
                </>} />
            ))}
          </List>
        )}
      </div>
    </div>
  );
}
