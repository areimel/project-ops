import { TagInput } from "../../../../components/common/TagInput";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

const noop = () => {};
const SERVICES = ["design", "hosting", "maintenance", "seo", "migration", "copywriting"];

export const entry = {
  id: "tag-input",
  title: "TagInput",
  family: "inputs",
  source: "renderer/components/common/TagInput.tsx",
  exports: ["TagInput"],
  purpose: "A list of short values shown as removable tag badges with a text input after them. The owner types a value and presses Enter or a comma to turn it into a tag; suggestions help but free text is allowed.",
  useFor: [
    "Project tags in the edit dialog, with the tags already in use as suggestions and a limit from PROJECT_LIMITS.",
    "A site's services on the dossier form.",
    "Any unordered set of short labels where each one is added, removed and compared ignoring case.",
  ],
  notFor: [
    "One value with suggestions, such as a category: use Combobox.",
    "Picking from a fixed list: use Dropdown, or Segmented for two or three choices.",
    "Filtering the grid by tag: the filter rail's tag list has its own include and exclude cycle and does not use this input.",
  ],
  snippet: "<TagInput\n  className=\"form-wide\"\n  label=\"Tags\"\n  value={draft.tags}\n  onChange={(v) => set(\"tags\", v)}\n  suggestions={tags}\n  max={PROJECT_LIMITS.tags}\n  maxLength={PROJECT_LIMITS.tag}\n  placeholder=\"Add a tag and press Enter\"\n/>",
  specimens: [
    { label: "Empty with placeholder", wide: true, render: () => <TagInput label="Tags" value={[]} placeholder="Add a tag and press Enter" onChange={noop} /> },
    { label: "With tags", wide: true, render: () => <TagInput label="Services" value={["design", "hosting"]} onChange={noop} /> },
    { label: "At max (3 of 3)", wide: true, render: () => <TagInput label="Tags" value={["client-site", "wordpress", "retainer"]} max={3} onChange={noop} /> },
    { label: "Suggestions open", wide: true, minHeight: 250, render: () => <TagInput label="Services" value={["design"]} suggestions={SERVICES} defaultOpen onChange={noop} /> },
    { label: "With an error message", wide: true, notInUse: true, render: () => <TagInput label="Tags" value={[]} error="Add at least one tag." onChange={noop} /> },
    {
      label: "Live: add and remove tags", wide: true, minHeight: 250,
      render: () => (
        <Live initial={["design"]}>
          {(value, set) => <TagInput label="Services" value={value} suggestions={SERVICES} max={5} placeholder="Add a service" onChange={set} />}
        </Live>
      ),
    },
  ],
  notes: [
    "Keys: Enter or a comma adds the typed text. Backspace in an empty input removes the last tag. Arrow Down or Up moves through suggestions and Enter picks the highlighted one. Escape closes the list. Keys are ignored while an input method is composing.",
    "Paste: text that contains a comma or a line break is split into tags in one go. Pasting a single word just types it.",
    "Blur commits: leaving the field with text still in the box adds it as a tag, so typed text is never lost. Clicking anywhere in the box focuses the input.",
    "Tags are trimmed, inner whitespace collapsed, cut to maxLength, and a duplicate in any case is dropped keeping the first spelling. Once max is reached further tags are ignored (the input stays; nothing says so, so say it in a hint if it matters). Suggestions already chosen are left out of the list.",
    "The wrapper is not a form-grid cell by default: pass className=\"form-wide\" inside a form-grid, as both forms do. defaultOpen exists for this page only.",
  ],
} satisfies CatalogueEntry;
