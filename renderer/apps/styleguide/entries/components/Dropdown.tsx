import { Dropdown } from "../../../../components/common/Dropdown";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

const OPTIONS = [
  { value: "recent", label: "Last commit" },
  { value: "name", label: "Name" },
  { value: "added", label: "Date added" },
];

const noop = () => {};

export const entry = {
  id: "dropdown",
  title: "Dropdown",
  family: "inputs",
  source: "renderer/components/common/Dropdown.tsx",
  exports: ["Dropdown", "Option"],
  purpose: "A button that opens a short menu of labelled choices and keeps one selected. Reach for it when the owner picks exactly one value from a fixed list and the list should stay out of the way until asked for.",
  useFor: [
    "The sort order in the projects toolbar, where the button text states the current choice (\"Sort: Name\").",
    "The editor and terminal pickers in Settings > Projects, one value out of the detected programs.",
    "Any list of about three to ten fixed options where the selection is shown on the button itself.",
  ],
  notFor: [
    "Two or three options that should all be visible at once, such as the theme mode: use Segmented.",
    "A free-text value with suggestions, such as a project category or tag: use Combobox or TagInput.",
    "Commands or actions: a Dropdown keeps a selection, it does not run things. Use Button or the command palette.",
  ],
  snippet: "<Dropdown\n  label=\"Sort projects\"\n  buttonText={`Sort: ${sortLabel}`}\n  options={SORT_OPTIONS}\n  selected={sort}\n  onSelect={setSort}\n/>",
  specimens: [
    { label: "Closed, with text", render: () => <Dropdown label="Sort projects" buttonText="Sort: Name" options={OPTIONS} selected="name" onSelect={noop} /> },
    { label: "Icon only", notInUse: true, render: () => <Dropdown label="Sort projects" icon="sort" options={OPTIONS} selected="name" onSelect={noop} /> },
    { label: "Disabled", render: () => <Dropdown label="Sort projects" buttonText="Sort: Name" options={OPTIONS} selected="name" disabled onSelect={noop} /> },
    { label: "No options (disabled)", render: () => <Dropdown label="Editor" buttonText="None found" options={[]} selected="" onSelect={noop} /> },
    { label: "Open", minHeight: 170, render: () => <Dropdown label="Sort projects" buttonText="Sort: Name" options={OPTIONS} selected="name" defaultOpen onSelect={noop} /> },
    {
      label: "Open above", notInUse: true, minHeight: 170,
      render: () => (
        <div style={{ paddingTop: 130 }}>
          <Dropdown label="Sort projects" buttonText="Sort: Name" options={OPTIONS} selected="name" placement="above" defaultOpen onSelect={noop} />
        </div>
      ),
    },
    {
      label: "Live: pick an option",
      render: () => (
        <Live initial="name">
          {(value, set) => (
            <Dropdown label="Sort projects" buttonText={`Sort: ${OPTIONS.find((o) => o.value === value)?.label}`} options={OPTIONS} selected={value} onSelect={set} />
          )}
        </Live>
      ),
    },
  ],
  notes: [
    "Keyboard: Arrow Down on the button opens the menu, arrows, Home and End move, Enter or Space picks, Escape closes and returns focus to the button.",
    "The menu is position absolute under the button, so leave room below it (or use placement \"above\" with room above). An empty option list disables the button.",
    "defaultOpen exists for this page only: it opens the menu without moving focus. Screens never pass it.",
  ],
} satisfies CatalogueEntry;
