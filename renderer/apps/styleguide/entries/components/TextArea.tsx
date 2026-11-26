import { TextArea } from "../../../../components/common/TextArea";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

const noop = () => {};
const NOTES = "Client wants the booking widget moved above the fold before launch.";

export const entry = {
  id: "text-area",
  title: "TextArea",
  family: "inputs",
  source: "renderer/components/common/TextArea.tsx",
  exports: ["TextArea"],
  purpose: "A multi-line input with its label above it, for prose the owner writes. It is resizable by default and keeps at least a few lines of height.",
  useFor: [
    "A project description in the edit dialog, where the placeholder shows the detected description.",
    "Site notes on the dossier form (plain text, rows set to 4).",
    "Any value longer than a line that the owner types freely.",
  ],
  notFor: [
    "A single-line value: use TextField.",
    "A list of short values such as tags: use TagInput.",
    "Secrets or passwords. Site notes are stored unencrypted in projects.json and in exports.",
  ],
  snippet: "<TextArea\n  label=\"Description\"\n  value={draft.description}\n  rows={3}\n  onChange={(v) => set(\"description\", v)}\n  placeholder={p.detected.description ?? \"No description found\"}\n  maxLength={PROJECT_LIMITS.description}\n/>",
  specimens: [
    { label: "With a value", render: () => <TextArea label="Notes" value={NOTES} rows={4} onChange={noop} /> },
    { label: "Empty with placeholder", render: () => <TextArea label="Description" value="" rows={3} placeholder="No description found" onChange={noop} /> },
    { label: "Monospace", notInUse: true, render: () => <TextArea label="Config" mono value={"{\n  \"name\": \"demo\"\n}"} rows={4} onChange={noop} /> },
    {
      label: "Fill (parent sets the height)", notInUse: true, width: 360,
      render: () => (
        <div style={{ height: 160, display: "flex", flexDirection: "column" }}>
          <TextArea label="Notes" fill value={NOTES} onChange={noop} />
        </div>
      ),
    },
    { label: "Invalid border only", notInUse: true, render: () => <TextArea label="Notes" invalid value="" rows={3} onChange={noop} /> },
    { label: "With an error message", notInUse: true, render: () => <TextArea label="Notes" value={NOTES} rows={3} error="Notes are too long." onChange={noop} /> },
    { label: "Disabled", notInUse: true, render: () => <TextArea label="Notes" value={NOTES} rows={3} disabled onChange={noop} /> },
    {
      label: "Live: type to edit",
      render: () => (
        <Live initial={NOTES}>
          {(value, set) => <TextArea label="Notes" value={value} rows={4} onChange={set} />}
        </Live>
      ),
    },
  ],
  notes: [
    "mono is meant for the Editor only; no screen in this app uses it. fill takes the full height of its parent and turns resizing off, so the parent needs a set height.",
    "Inside a form-grid a TextArea spans both columns on its own; a TextField needs form-wide to do that.",
    "rows and maxLength pass through to the native element. error shows the words under the field; invalid alone only draws the border.",
  ],
} satisfies CatalogueEntry;
