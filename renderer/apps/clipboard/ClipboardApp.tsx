import { useState } from "react";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { IconButton } from "../../components/common/IconButton";
import { List, ListRow } from "../../components/common/List";
import { TextField } from "../../components/common/TextField";
import { useCollection } from "../../hooks/useCollection";
import { useCommandHandlers, useShell, useTitleInfo } from "../../shell/ShellContext";
import { errorMessage } from "../../utils/errorMessage";
import { MAX_CLIPBOARD_READ } from "../../../shared/ipc/clipboard";
import type { Snippet } from "../../../shared/collections/snippets";
import { SnippetDialog } from "./SnippetDialog";
import { SNIPPET_LIMIT, filterSnippets, labelFrom } from "./snippetsModel";
import "./clipboard.css";

type Editing = { id: string | null; label: string; text: string };   // id null: a new snippet


export default function ClipboardApp() {
  const { toast } = useShell();
  const store = useCollection("snippets");
  const [clip, setClip] = useState<string | null>(null);   // null until the person reads the clipboard
  const [editing, setEditing] = useState<Editing | null>(null);
  const [query, setQuery] = useState("");
  const shown = filterSnippets(store.items, query);

  useTitleInfo({ count: `${store.items.length} ${store.items.length === 1 ? "snippet" : "snippets"}` });

  const read = async () => {
    try {
      setClip((await window.app.invoke("clipboard:read")).text);
    } catch (e) {
      toast("error", `Could not read the clipboard: ${errorMessage(e)}. Try again.`);
    }
  };
  const copy = async (text: string) => {
    try {
      await window.app.invoke("clipboard:write", text);
      toast("success", "Copied to clipboard");
    } catch (e) {
      toast("error", `Could not copy: ${errorMessage(e)}. Try again.`);
    }
  };
  const save = async (label: string, text: string, id: string | null = null) => {
    if (!id && store.items.length >= SNIPPET_LIMIT) {
      toast("error", `You already have ${SNIPPET_LIMIT} snippets, the most this app keeps. Delete one to save another.`);
      return;
    }
    try {
      if (id) await store.update(id, { label, text }); else await store.create({ label, text });
      setEditing(null);
      toast("success", id ? "Snippet updated" : "Snippet saved");
    } catch (e) {
      toast("error", `Could not save the snippet: ${errorMessage(e)}. Try again.`);
    }
  };
  const remove = async (s: Snippet) => {
    try {
      const removed = await store.remove(s.id);
      toast("info", "Snippet deleted", { label: "Undo", run: () => { void store.restore(removed); } });
    } catch (e) {
      toast("error", `Could not delete the snippet: ${errorMessage(e)}. Try again.`);
    }
  };
  const newSnippet = () => setEditing({ id: null, label: "", text: "" });

  useCommandHandlers({ "clipboard.read": () => { void read(); }, "clipboard.newSnippet": newSnippet });

  return (
    <div className="app-root clipboard">
      <section className="clipboard-section" aria-labelledby="clipboard-now">
        <div className="clipboard-head">
          <h2 id="clipboard-now">On the clipboard</h2>
          <Button variant="quiet" icon="refresh" onClick={() => { void read(); }}>Read clipboard</Button>
        </div>
        {clip === null && <p className="clipboard-note">Nothing read yet. Select Read clipboard to see the text you last copied.</p>}
        {clip === "" && <p className="clipboard-note">The clipboard has no text. Copy some text elsewhere, then read it again.</p>}
        {clip && (
          <>
            <pre className="clipboard-text">{clip}</pre>
            {clip.length >= MAX_CLIPBOARD_READ && <p className="clipboard-note">Showing the first {MAX_CLIPBOARD_READ.toLocaleString()} characters.</p>}
            <div className="clipboard-actions">
              <Button onClick={() => { void save(labelFrom(clip), clip); }}>Save as snippet</Button>
            </div>
          </>
        )}
      </section>

      <section className="clipboard-section" aria-labelledby="clipboard-snippets">
        <div className="clipboard-head">
          <h2 id="clipboard-snippets">Snippets</h2>
          <Button variant="quiet" icon="plus" onClick={newSnippet}>New snippet</Button>
        </div>
        {store.status === "error" && (
          <EmptyState icon="warning" title="Snippets could not be loaded" body={store.error ?? "The file could not be read."}
            action={<Button onClick={store.reload}>Try again</Button>} />
        )}
        {store.status === "ready" && store.items.length === 0 && (
          <EmptyState icon="clipboard" title="Save text you paste often"
            body="Snippets are kept on this computer and copy back to the clipboard in one click."
            action={<Button onClick={newSnippet}>New snippet</Button>} />
        )}
        {store.items.length > 0 && (
          <>
            <TextField label="Filter snippets" hideLabel type="search" placeholder="Filter snippets" value={query} onChange={setQuery} />
            {shown.length === 0 && <p className="clipboard-note">No snippet matches "{query.trim()}". Clear the filter to see them all.</p>}
            <List label="Snippets">
              {shown.map((s) => (
                <ListRow key={s.id} onSelect={() => setEditing({ id: s.id, label: s.label, text: s.text })}
                  title={s.label || labelFrom(s.text)} secondary={s.label ? s.text.replace(/\s+/g, " ") : undefined}
                  trailing={<>
                    <Button variant="quiet" icon="copy" onClick={() => { void copy(s.text); }}>Copy</Button>
                    <IconButton icon="trash" label={`Delete ${s.label || "snippet"}`} onClick={() => { void remove(s); }} />
                  </>} />
              ))}
            </List>
          </>
        )}
      </section>

      {editing && (
        <SnippetDialog title={editing.id ? "Edit snippet" : "New snippet"} initial={editing}
          onSave={(label, text) => { void save(label, text, editing.id); }} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
