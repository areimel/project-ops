import { useDeferredValue, useMemo, useState, type DragEvent } from "react";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { SplitPane } from "../../components/common/SplitPane";
import { TextArea } from "../../components/common/TextArea";
import { useCommandHandlers, useNavigationGuard, useTitleInfo } from "../../shell/ShellContext";
import { EditorToolbar } from "./EditorToolbar";
import { wordCount } from "./editorModel";
import { renderMarkdown } from "./markdown";
import { useEditor } from "./useEditor";
import "./editor.css";

const hasFiles = (e: DragEvent): boolean => e.dataTransfer.types.includes("Files");

export default function EditorApp() {
  const editor = useEditor();
  const { doc, dirty } = editor;
  const [preview, setPreview] = useState(true);
  const [dropping, setDropping] = useState(false);
  // Rendering waits for a pause in typing, so a large file does not slow the text area down.
  const deferred = useDeferredValue(doc?.text ?? "");
  const html = useMemo(() => renderMarkdown(deferred), [deferred]);

  useTitleInfo({ count: doc ? `${wordCount(doc.text)} words` : undefined, saveState: doc ? editor.saveState : undefined });
  useNavigationGuard(dirty ? `${doc?.name} has changes that are not saved.` : null);
  useCommandHandlers({
    "editor.new": editor.newFile, "editor.open": editor.openDialog, "editor.save": editor.save,
    "editor.saveAs": editor.saveAs, "editor.preview": () => setPreview((v) => !v),
  });

  // Dropped files are handed to main as File objects; the preload resolves their paths, never this page.
  const onDrop = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    setDropping(false);
    editor.openDropped(Array.from(e.dataTransfer.files));
  };

  const text = doc && (
    <TextArea mono fill hideLabel label="Document text" value={doc.text} onChange={editor.edit} spellCheck={false} />
  );

  return (
    <div className={`app-root editor ${dropping ? "is-dropping" : ""}`.trim()}
      onDragOver={(e) => { if (hasFiles(e)) { e.preventDefault(); setDropping(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropping(false); }}
      onDrop={onDrop}>
      <EditorToolbar editor={editor} preview={preview} onTogglePreview={() => setPreview((v) => !v)} />
      <div className="editor-body">
        {!doc ? (
          <EmptyState icon="editor" title="Open a file or start a new one"
            body="Markdown and plain text files up to 2 MB. You can also drop a file here."
            action={<div className="editor-actions">
              <Button icon="folder" onClick={editor.openDialog}>Open a file</Button>
              <Button variant="quiet" icon="plus" onClick={editor.newFile}>Start a new file</Button>
            </div>} />
        ) : (
          preview ? <SplitPane label="Editor and preview" startWidth="1fr" start={text} end={
            // Safe to inject: markdown-it runs with html: false, so the document cannot add elements.
            <div className="editor-preview" role="region" aria-label="Preview" tabIndex={0}
              dangerouslySetInnerHTML={{ __html: html }} />
          } /> : text
        )}
      </div>
    </div>
  );
}
