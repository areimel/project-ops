import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { OpenedFile, RecentView } from "../../../shared/ipc/editor";
import { useAppEvent } from "../../hooks/useAppEvent";
import { useLatest } from "../../hooks/useLatest";
import { useShell, type SaveState } from "../../shell/ShellContext";
import { editorReducer, isDirty, openError, saveError, untitledName, type EditorState } from "./editorModel";

export interface Editor {
  doc: EditorState;
  dirty: boolean;
  saveState: SaveState;
  recents: RecentView[];
  edit(text: string): void;
  newFile(): void;
  openDialog(): void;
  openRecent(id: string): void;
  openDropped(files: File[]): void;
  save(): void;
  saveAs(): void;
}

/** Everything the Editor does with files. Components only render `doc` and call these. */
export function useEditor(): Editor {
  const shell = useShell();
  const [doc, dispatch] = useReducer(editorReducer, null as EditorState);
  const [recents, setRecents] = useState<RecentView[]>([]);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useLatest(doc);
  const dirty = isDirty(doc);

  const refreshRecents = useCallback(() => {
    window.app.invoke("editor:recents").then(setRecents, () => setRecents([]));
  }, []);

  /** Asks before throwing away unsaved text. Reads the latest document, since it may run after an await. */
  const canReplace = useCallback(async (): Promise<boolean> => {
    const d = latest.current;
    if (!isDirty(d)) return true;
    return shell.confirm({
      title: "Discard unsaved changes?", body: `${d?.name} has changes that are not saved.`,
      confirmLabel: "Discard changes", cancelLabel: "Keep editing", danger: true,
    });
  }, [latest, shell]);

  const show = useCallback(async (file: OpenedFile | null) => {
    if (!file || !(await canReplace())) return;
    dispatch({ type: "opened", file });
    setFailed(false);
    refreshRecents();
  }, [canReplace, refreshRecents]);

  /** Runs a call that yields a file to open; a refusal from main becomes a toast that says what to do. */
  const open = useCallback(async (get: () => Promise<OpenedFile | null>) => {
    try { await show(await get()); } catch (e) { shell.toast("error", openError(e)); }
  }, [show, shell]);

  const takePending = useCallback(() => { void open(() => window.app.invoke("editor:take-pending")); }, [open]);
  useEffect(() => { takePending(); refreshRecents(); }, [takePending, refreshRecents]);
  // A file named by a second instance arrives while the sheet is already open: the shell announces it as a deep link.
  useAppEvent("app:deep-link", (l) => { if (l.appId === "editor") takePending(); });

  const saveAs = useCallback(async () => {
    const d = latest.current;
    if (!d) return;
    setSaving(true);
    try {
      const file = await window.app.invoke("editor:save-as", d.fileId, d.text, d.fileId ? d.name : untitledName(d.text));
      if (file) { dispatch({ type: "saved", file, text: d.text }); setFailed(false); refreshRecents(); }
    } catch (e) {
      setFailed(true);
      shell.toast("error", saveError(e, d.name));
    } finally { setSaving(false); }
  }, [latest, refreshRecents, shell]);

  const save = useCallback(async () => {
    const d = latest.current;
    if (!d || saving) return;
    if (!d.fileId) return saveAs();
    setSaving(true);
    try {
      dispatch({ type: "saved", file: await window.app.invoke("editor:save", d.fileId, d.text), text: d.text });
      setFailed(false);
    } catch (e) {
      setFailed(true);
      shell.toast("error", saveError(e, d.name));
    } finally { setSaving(false); }
  }, [latest, saving, saveAs, shell]);

  const newFile = useCallback(async () => { if (await canReplace()) dispatch({ type: "new" }); }, [canReplace]);
  const saveState: SaveState = saving ? "saving" : failed && dirty ? "error" : dirty ? "unsaved" : "saved";

  const openDropped = useCallback((files: File[]) => {
    void open(async () => {
      const file = await window.app.drop("editor:open-dropped", files);
      if (!file) shell.toast("info", "Only .md, .markdown and .txt files open here. Drop one of those.");
      return file;
    });
  }, [open, shell]);

  return {
    doc, dirty, saveState, recents,
    edit: (text) => dispatch({ type: "edited", text }),
    newFile: () => void newFile(),
    openDialog: () => void open(() => window.app.invoke("editor:open-dialog")),
    openRecent: (id) => void open(() => window.app.invoke("editor:open-recent", id)),
    openDropped,
    save: () => void save(),
    saveAs: () => void saveAs(),
  };
}
