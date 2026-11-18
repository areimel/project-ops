import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { SplitPane } from "../../components/common/SplitPane";
import { Spinner } from "../../components/common/Spinner";
import { useCollection } from "../../hooks/useCollection";
import { useCommandHandlers, useShell, useTitleInfo, type SaveState } from "../../shell/ShellContext";
import { errorMessage } from "../../utils/errorMessage";
import { NoteEditor } from "./NoteEditor";
import { NoteList } from "./NoteList";
import { displayTitle, filterNotes, noteCount, sortNotes } from "./notesModel";
import "./notes.css";

export default function NotesApp() {
  const { items, status, error, reload, create, remove, restore, update } = useCollection("notes");
  const { route, toast, confirm } = useShell();
  const search = useRef<HTMLInputElement>(null);
  // A deep link (route.recordId) selects a note. After that the selection is ours.
  const [selectedId, setSelectedId] = useState<string | null>(route.view === "app" ? route.recordId : null);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");

  useEffect(() => {
    if (route.view === "app" && route.recordId) setSelectedId(route.recordId);
  }, [route]);

  const shown = useMemo(() => sortNotes(filterNotes(items, query)), [items, query]);
  const selected = items.find((n) => n.id === selectedId) ?? null;

  useTitleInfo({ count: status === "ready" ? noteCount(items.length) : undefined, saveState: selected ? saveState : undefined });

  const select = (id: string | null) => { setSelectedId(id); setSaveState("saved"); };

  const newNote = async () => {
    try {
      const note = await create({ title: "", body: "" });
      setQuery("");
      setJustCreated(note.id);
      select(note.id);
    } catch (e) {
      toast("error", `A new note could not be created (${errorMessage(e)}). Try again.`);
    }
  };

  const deleteSelected = async () => {
    if (!selected) return;
    const ok = await confirm({
      title: "Delete this note?", body: `"${displayTitle(selected)}" will be removed.`, confirmLabel: "Delete note", danger: true,
    });
    if (!ok) return;
    try {
      const removed = await remove(selected.id);
      select(null);
      toast("info", "Note deleted", { label: "Undo", run: () => void restore(removed).then(() => select(removed.record.id)) });
    } catch (e) {
      toast("error", `The note could not be deleted (${errorMessage(e)}). Try again.`);
    }
  };

  const togglePin = () => { if (selected) void update(selected.id, { pinned: !selected.pinned }); };

  useCommandHandlers({
    "notes.new": () => void newNote(),
    "notes.search": () => search.current?.focus(),
    "notes.pin": togglePin,
    "notes.delete": () => void deleteSelected(),
  });

  const newButton = <Button icon="plus" onClick={() => void newNote()}>New note</Button>;
  const frame = (children: React.ReactNode) => <div className="app-root notes">{children}</div>;

  if (status === "loading") return frame(<Spinner label="Loading notes" />);
  if (status === "error") {
    return frame(
      <EmptyState icon="warning" title="Notes could not be loaded"
        body={`${error ?? "The notes file could not be read."} If this keeps happening, open the data folder from Settings.`}
        action={<Button onClick={reload}>Try again</Button>} />,
    );
  }
  if (items.length === 0) {
    return frame(<EmptyState icon="notes" title="Write your first note" body="Notes are saved on this computer as you type." action={newButton} />);
  }

  return frame(
    <SplitPane label="Notes" startWidth="300px"
      start={(
        <>
          <NoteList searchRef={search} notes={shown} query={query} onQuery={setQuery} selectedId={selectedId} onSelect={select} />
          <div className="notes-new">{newButton}</div>
        </>
      )}
      end={selected ? (
        <NoteEditor key={selected.id} note={selected} autoFocus={selected.id === justCreated}
          onSaveState={setSaveState} onPin={togglePin} onDelete={() => void deleteSelected()} />
      ) : (
        <EmptyState title="No note selected" body="Choose a note from the list, or start a new one." action={newButton} />
      )}
    />,
  );
}
