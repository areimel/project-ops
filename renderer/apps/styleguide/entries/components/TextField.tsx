import { TextField } from "../../../../components/common/TextField";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

const noop = () => {};

export const entry = {
  id: "text-field",
  title: "TextField",
  family: "inputs",
  source: "renderer/components/common/TextField.tsx",
  exports: ["TextField"],
  purpose: "A single-line input with its label above it, for one free value the owner types. It takes every native input attribute (placeholder, maxLength, disabled, inputMode) besides the ones it controls.",
  useFor: [
    "Plain text values in the project and link dialogs: project name, client, link name and address.",
    "A date (type \"date\") such as the launch date, and the search box in the projects toolbar (type \"search\", hidden label).",
    "Showing what is wrong with a value through the error prop, as the link address and project links do.",
  ],
  notFor: [
    "A value that should usually come from a known list, such as a category or hosting provider: use Combobox, which is a text input with suggestions.",
    "Several values such as tags or services: use TagInput. Long or multi-line text: use TextArea.",
    "A choice from a fixed list: use Dropdown or Segmented. A label next to a non-text control: use Field.",
  ],
  snippet: "<TextField\n  label=\"Address\"\n  value={draft.url}\n  onChange={(v) => set(\"url\", v)}\n  error={problem ?? undefined}\n  placeholder=\"https://\"\n  spellCheck={false}\n  inputMode=\"url\"\n/>",
  specimens: [
    { label: "Text with a value", render: () => <TextField label="Client" value="Harbour Street Cafe" onChange={noop} /> },
    { label: "Empty with placeholder", render: () => <TextField label="Name" value="" placeholder="Netlify" onChange={noop} /> },
    { label: "Search, hidden label", render: () => <TextField type="search" label="Search projects" hideLabel placeholder="Search projects" value="" onChange={noop} /> },
    { label: "Number", notInUse: true, render: () => <TextField type="number" label="Pages" value="12" onChange={noop} /> },
    { label: "Date", render: () => <TextField type="date" label="Launch date" value="2026-12-01" onChange={noop} /> },
    { label: "Disabled", notInUse: true, render: () => <TextField label="Client" value="Harbour Street Cafe" disabled onChange={noop} /> },
    { label: "Invalid border only", notInUse: true, render: () => <TextField label="Name" value="" invalid onChange={noop} /> },
    { label: "With an error message", render: () => <TextField label="Address" value="http://example.com" error="Use an https address." onChange={noop} /> },
    {
      label: "Live: type to edit",
      render: () => (
        <Live initial="Harbour Street Cafe">
          {(value, set) => <TextField label="Client" value={value} onChange={set} onEnter={noop} />}
        </Live>
      ),
    },
  ],
  notes: [
    "onChange receives the string, not the event. onEnter fires on Enter; inside a FormDialog the form submit already handles Enter, so dialogs do not pass it.",
    "invalid only draws the border and sets aria-invalid. error does both and also shows the words under the field, linked with aria-describedby. Prefer error; no screen uses invalid alone.",
    "data-autofocus on the first field of a dialog tells Dialog where to put focus. The ref prop reaches the inner input.",
  ],
} satisfies CatalogueEntry;
