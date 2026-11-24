import { useId } from "react";
import { Dropdown } from "../../../../components/common/Dropdown";
import { Field, FieldError, FieldLabel } from "../../../../components/common/Field";
import { Segmented } from "../../../../components/common/Segmented";
import { Switch } from "../../../../components/common/Switch";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

const noop = () => {};
const MODES = [{ value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }];
function Parts() {
  const id = useId();
  return (
    <div className="styleguide-stack">
      <FieldLabel htmlFor={id}>Address</FieldLabel>
      <FieldError id={`${id}-error`}>Use an https address.</FieldError>
    </div>
  );
}
const EDITORS = [{ value: "code", label: "Visual Studio Code" }, { value: "zed", label: "Zed" }];

export const entry = {
  id: "field",
  title: "Field",
  family: "inputs",
  source: "renderer/components/common/Field.tsx",
  exports: ["Field", "FieldLabel", "FieldError"],
  purpose: "Field puts a label, one control and an optional hint together for controls that have no label of their own (Switch, Segmented, Dropdown, buttons). FieldLabel and FieldError are the two smaller parts the text inputs use inside themselves.",
  useFor: [
    "Settings rows: Mode, Accent, Close to tray, the editor and terminal pickers, Backup, Reset.",
    "Labelled non-text controls in the project dialog: Status (Segmented) and Pinned (Switch).",
    "FieldLabel and FieldError when building a new text-like input, so the label and error look like TextField's.",
  ],
  notFor: [
    "A text, search or date value: TextField, TextArea, Combobox and TagInput already render their own label and error. Wrapping them in Field doubles the label.",
    "A group heading or section title: use SectionHead.",
    "Helper text with no control to explain: use a paragraph with the .hint class. Field expects a control as its child.",
  ],
  snippet: "<Field label=\"Mode\" hint=\"System follows your operating system.\">\n  <Segmented label=\"Mode\" options={MODES} value={mode} onChange={setMode} />\n</Field>",
  specimens: [
    { label: "Plain", render: () => <Field label="Pinned"><Switch checked label="Pin to the top" onChange={noop} /></Field> },
    { label: "With a hint", render: () => <Field label="Close to tray" hint="Closing the window keeps the app running in the tray."><Switch checked={false} label="Close to tray" onChange={noop} /></Field> },
    { label: "Wrapping a Segmented", render: () => <Field label="Mode" hint="System follows your operating system."><Segmented label="Mode" options={MODES} value="dark" onChange={noop} /></Field> },
    { label: "Wrapping a Dropdown", minHeight: 150, render: () => <Field label="Editor"><Dropdown label="Editor" buttonText="Visual Studio Code" options={EDITORS} selected="code" defaultOpen onSelect={noop} /></Field> },
    {
      label: "Settings look: label left, control right", wide: true,
      render: () => (
        <div className="settings" style={{ overflow: "visible" }}>
          <Live initial="dark">
            {(value, set) => (
              <Field label="Mode" hint="System follows your operating system.">
                <Segmented label="Mode" options={MODES} value={value} onChange={set} />
              </Field>
            )}
          </Live>
        </div>
      ),
    },
    {
      label: "Dialog look: stacked in two columns", wide: true,
      render: () => (
        <div className="form-grid">
          <Field label="Status"><Segmented label="Status" options={[{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }]} value="active" onChange={noop} /></Field>
          <Field label="Pinned"><Switch checked label="Pin to the top" onChange={noop} /></Field>
        </div>
      ),
    },
    {
      label: "FieldLabel and FieldError on their own",
      render: () => <Parts />,
    },
  ],
  notes: [
    "Pass htmlFor only when the control has an id to point at. Switch and Segmented carry their own aria-label, so the Field label is the visible copy of it and the call sites pass no htmlFor.",
    "Two looks, one component. Settings wraps its sections in .settings, where from 760px viewport width a field becomes two columns: label and hint on the left (15rem), control on the right. Below that width it stacks, like everywhere else. The dialogs use .form-grid, where each field stays stacked (label above, control below) inside the dialog's two equal columns. The component is identical; the screen's wrapper class decides. The settings specimen above only goes two-column in a window at least 760px wide.",
    "FieldLabel has a hidden prop that keeps the label for assistive tech only; FieldError takes an id, which the input links with aria-describedby (use joinIds from fieldModel to combine ids).",
  ],
} satisfies CatalogueEntry;
