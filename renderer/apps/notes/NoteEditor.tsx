import { useCallback, useEffect, useRef, useState } from "react";
import type { Note } from "../../../shared/collections/notes";
import { Button } from "../../components/common/Button";
import { TextArea } from "../../components/common/TextArea";
import { TextField } from "../../components/common/TextField";
import { Toolbar } from "../../components/common/Toolbar";
import { useCollection } from "../../hooks/useCollection";
import { useLatest } from "../../hooks/useLatest";
import { useShell, type SaveState } from "../../shell/ShellContext";
import { errorMessage } from "../../utils/errorMessage";
import { draftPatch, type Draft } from "./notesModel";
import { IDLE_TRACK, track, trackState, type SaveEvent, type SaveTrack } from "./saveTracker";

const AUTOSAVE_MS = 500;

/**
 * Edits one note. Typing changes a local draft only; the draft is saved 500 ms after the last keystroke, when
 * focus leaves the editor, when the editor closes, and when the page is torn down (window close, quit, reload:
 * React does not unmount then, so `pagehide` flushes). The IPC send is made before the page goes, and main
 * still handles it. Chosen over a close guard because a guard would put a dialog in front of a half-second gap
 * that a save closes by itself. The parent keys this component by note id, so the draft starts fresh for each
 * note and is never overwritten by the list refreshing underneath it.
 */
export function NoteEditor(p: {
  note: Note; autoFocus: boolean; onSaveState(s: SaveState): void; onPin(): void; onDelete(): void;
}) {
  const { update } = useCollection("notes");
  const { toast } = useShell();
  const [draft, setDraft] = useState<Draft>({ title: p.note.title, body: p.note.body });
  const draftRef = useLatest(draft);
  const noteRef = useLatest(p.note);
  const onSaveState = useLatest(p.onSaveState);
  const timer = useRef<number | undefined>(undefined);
  const tracked = useRef<SaveTrack>(IDLE_TRACK);
  const alive = useRef(true);

  // Quiet reports (closing, unloading) and reports from a closed editor never reach the shell: the parent has
  // moved on to another note by then.
  const report = useCallback((e: SaveEvent, quiet: boolean) => {
    tracked.current = track(tracked.current, e);
    if (!quiet && alive.current) onSaveState.current(trackState(tracked.current));
  }, [onSaveState]);

  const save = useCallback(async (quiet: boolean) => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    const patch = draftPatch(noteRef.current, draftRef.current);
    if (!patch) { report("clean", quiet); return; }
    report("start", quiet);
    try {
      await update(noteRef.current.id, patch);
      report("ok", quiet);
    } catch (e) {
      report("fail", quiet);
      // When the editor is closing (or its note was just deleted) there is nobody left to tell.
      if (quiet || !alive.current) return;
      toast("error", `This note could not be saved (${errorMessage(e)}). Your text is still here: edit it again to retry.`);
    }
  }, [update, toast, noteRef, draftRef, report]);

  const change = (next: Draft) => {
    setDraft(next);
    report("edit", false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void save(false), AUTOSAVE_MS);
  };

  // Closing the editor (another note, another sheet, a deleted note) or the page saves what is pending.
  const flush = useLatest(() => { if (tracked.current.dirty) void save(true); });
  useEffect(() => {
    alive.current = true;
    const onHide = () => flush.current();
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      flush.current();
      alive.current = false;
    };
  }, [flush]);

  return (
    <div className="notes-editor" onBlur={() => void save(false)}>
      <Toolbar label="Note actions" end={<Button variant="quiet" icon="trash" onClick={p.onDelete}>Delete note</Button>}>
        <Button variant="quiet" icon="pin" onClick={p.onPin}>{p.note.pinned ? "Unpin note" : "Pin note"}</Button>
      </Toolbar>
      <div className="notes-fields">
        <TextField label="Title" placeholder="Untitled note" autoFocus={p.autoFocus} maxLength={200}
          value={draft.title} onChange={(title) => change({ ...draft, title })} />
        <TextArea fill label="Note" placeholder="Write something" maxLength={100_000}
          value={draft.body} onChange={(body) => change({ ...draft, body })} />
      </div>
    </div>
  );
}
