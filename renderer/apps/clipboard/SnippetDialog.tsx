import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Dialog } from "../../components/common/Dialog";
import { TextArea } from "../../components/common/TextArea";
import { TextField } from "../../components/common/TextField";
import { labelFrom } from "./snippetsModel";

interface Props {
  title: string;                                   // "New snippet" | "Edit snippet"
  initial: { label: string; text: string };
  onSave(label: string, text: string): void;
  onClose(): void;
}

export function SnippetDialog({ title, initial, onSave, onClose }: Props) {
  const [label, setLabel] = useState(initial.label);
  const [text, setText] = useState(initial.text);
  const canSave = text.trim() !== "";              // main drops a snippet with no text
  const save = () => { if (canSave) onSave(label.trim() || labelFrom(text), text); };

  return (
    <Dialog title={title} onClose={onClose}
      footer={<>
        <Button variant="quiet" onClick={onClose}>Cancel</Button>
        <Button disabled={!canSave} onClick={save}>Save</Button>
      </>}>
      <div className="clipboard-form">
        <TextField label="Label" value={label} maxLength={100} placeholder="Defaults to the first line of the text"
          onChange={setLabel} onEnter={save} />
        <TextArea label="Text" value={text} rows={8} maxLength={20_000} data-autofocus onChange={setText} />
      </div>
    </Dialog>
  );
}
