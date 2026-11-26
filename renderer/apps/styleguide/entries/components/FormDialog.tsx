import { Combobox } from "../../../../components/common/Combobox";
import { Field } from "../../../../components/common/Field";
import { FormDialog } from "../../../../components/common/FormDialog";
import { Segmented } from "../../../../components/common/Segmented";
import { Switch } from "../../../../components/common/Switch";
import { TextField } from "../../../../components/common/TextField";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

const noop = () => {};
const save = async () => true;
const GROUPS = ["Hosting", "Design", "Analytics"];
const STATUS = [{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }, { value: "archived", label: "Archived" }];

export const entry = {
  id: "form-dialog",
  title: "FormDialog",
  family: "overlays",
  source: "renderer/components/common/FormDialog.tsx",
  exports: ["FormDialog"],
  purpose: "A Dialog wrapped around one form, with Cancel and a primary save button in the footer and an optional Remove button. It owns the form element, the saving state and the save flow, so each edit dialog only supplies its fields.",
  useFor: [
    "The edit project dialog (size lg, Remove asks first through useShell().confirm).",
    "The add or edit link dialog on the dashboard (md by default; Remove only when editing an existing link).",
    "Any dialog whose job is to collect a few fields and save them in one step.",
  ],
  notFor: [
    "A dialog with no form, such as the shortcut help or the command palette: use Dialog directly.",
    "A yes or no question: call useShell().confirm. Settings changes: they save as you change them, with no dialog.",
    "Saving each field as it changes: this dialog saves once, from a draft, when the owner presses the primary button or Enter.",
  ],
  snippet: "<FormDialog\n  title=\"Edit link\"\n  saveLabel=\"Save changes\"\n  invalid={draftInvalid(draft)}\n  patch={() => draftPatch(draft, link)}\n  onSave={onSave}\n  onRemove={link ? onRemove : undefined}\n  onClose={onClose}\n  formClassName=\"form-grid\"\n>\n  <TextField label=\"Name\" data-autofocus value={draft.name} onChange={(v) => set(\"name\", v)} />\n</FormDialog>",
  specimens: [
    {
      label: "New record: no Remove button", wide: true,
      render: () => (
        <FormDialog inline title="Add a link" saveLabel="Add link" invalid={false} patch={() => ({})} onSave={save} onClose={noop} formClassName="form-grid">
          <TextField label="Name" value="Netlify" onChange={noop} placeholder="Netlify" />
          <Combobox label="Group" value="Hosting" onChange={noop} suggestions={GROUPS} placeholder="Optional, such as Hosting" />
          <TextField className="form-wide" label="Address" value="https://app.netlify.com/" onChange={noop} placeholder="https://" />
        </FormDialog>
      ),
    },
    {
      label: "Edit with Remove", wide: true,
      render: () => (
        <FormDialog inline title="Edit link" saveLabel="Save changes" invalid={false} patch={() => ({})} onSave={save} onRemove={noop} onClose={noop} formClassName="form-grid">
          <TextField label="Name" value="Netlify" onChange={noop} />
          <Combobox label="Group" value="Hosting" onChange={noop} suggestions={GROUPS} />
          <TextField className="form-wide" label="Address" value="https://app.netlify.com/" onChange={noop} />
        </FormDialog>
      ),
    },
    {
      label: "Invalid: Save disabled", wide: true,
      render: () => (
        <FormDialog inline title="Add a link" saveLabel="Add link" invalid patch={() => ({})} onSave={save} onClose={noop} formClassName="form-grid">
          <TextField label="Name" value="" onChange={noop} placeholder="Netlify" />
          <Combobox label="Group" value="" onChange={noop} suggestions={GROUPS} placeholder="Optional, such as Hosting" />
          <TextField className="form-wide" label="Address" value="http://app.netlify.com/" error="Use an https address." onChange={noop} />
        </FormDialog>
      ),
    },
    {
      label: "Wide, with Field controls (Live)", wide: true,
      render: () => (
        <Live initial={{ status: "active", pinned: true, name: "harbour-street-site" }}>
          {(v, set) => (
            <FormDialog inline title="Edit project" size="lg" saveLabel="Save changes" invalid={v.name.trim() === ""} patch={() => ({})} onSave={save} onRemove={noop} removeLabel="Remove project" onClose={noop} formClassName="form-grid">
              <TextField className="form-wide" label="Name" value={v.name} onChange={(name) => set({ ...v, name })} error={v.name.trim() === "" ? "A project needs a name." : undefined} />
              <Field label="Status"><Segmented label="Status" options={STATUS} value={v.status} onChange={(status) => set({ ...v, status })} /></Field>
              <Field label="Pinned"><Switch checked={v.pinned} label="Pin to the top" onChange={(pinned) => set({ ...v, pinned })} /></Field>
            </FormDialog>
          )}
        </Live>
      ),
    },
  ],
  notes: [
    "Every specimen here is shown in place with inline: no backdrop, no focus move. Never pass inline in a screen; the real dialog is modal like Dialog. The footer buttons do nothing on this page (onSave resolves true, onClose is empty).",
    "FormDialog owns: the form element (Enter submits through a hidden submit button), the saving flag (the primary button is disabled while onSave runs and a second submit is ignored), the footer (Remove at the start, then Cancel and the primary button) and the save flow: do nothing when invalid, close without saving when patch() returns null, otherwise await onSave(patch) and close only when it resolves true.",
    "The caller owns: the draft state (a useState of the fields, as ProjectDialog and LinkDialog do), the patch() function that turns the draft into only the changed fields (null for no change), the invalid flag (a model function such as draftInvalid), what onSave does with the patch and whether it shows its own error, and what Remove does (both screens ask through useShell().confirm and then close).",
    "Pass formClassName=\"form-grid\" for two equal columns; a child with form-wide spans both, and a TextArea spans both by itself. Put data-autofocus on the first field so the open dialog focuses it. The status and pinned rows use Field because Segmented and Switch have no label of their own.",
    "The invalid specimen shows the Save button disabled; while saving the same button disables, which is a moment too short to hold still in a static specimen.",
  ],
} satisfies CatalogueEntry;
