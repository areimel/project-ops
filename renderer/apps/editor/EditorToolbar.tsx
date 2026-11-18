import { Button } from "../../components/common/Button";
import { Dropdown } from "../../components/common/Dropdown";
import { Toolbar } from "../../components/common/Toolbar";
import type { Editor } from "./useEditor";
import { useHint } from "../../shell/ShellContext";

export function EditorToolbar(p: { editor: Editor; preview: boolean; onTogglePreview(): void }) {
  const { doc, recents } = p.editor;
  const tip = useHint();
  return (
    <Toolbar label="File" end={<>
      <span className="editor-file" title={doc ? `${doc.name} in ${doc.folder}` : undefined}>
        {doc && <><strong>{doc.name}</strong> <span className="editor-folder">{doc.folder}</span></>}
      </span>
      <Button variant="quiet" aria-pressed={p.preview} disabled={!doc} title={tip("editor.preview")} onClick={p.onTogglePreview}>Preview</Button>
    </>}>
      <Button variant="quiet" icon="plus" title={tip("editor.new")} onClick={p.editor.newFile}>New</Button>
      <Button variant="quiet" icon="folder" title={tip("editor.open")} onClick={p.editor.openDialog}>Open</Button>
      <Button variant="quiet" icon="save" title={tip("editor.save")} disabled={!doc} onClick={p.editor.save}>Save</Button>
      <Button variant="quiet" title={tip("editor.saveAs")} disabled={!doc} onClick={p.editor.saveAs}>Save as</Button>
      <Dropdown label="Open a recent file" buttonText="Recent" selected="" onSelect={p.editor.openRecent}
        disabled={recents.length === 0} options={recents.map((r) => ({ value: r.id, label: `${r.name} in ${r.folder}` }))} />
    </Toolbar>
  );
}
