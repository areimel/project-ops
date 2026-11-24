import { useId } from "react";
import { SuggestionList } from "../../../../components/common/SuggestionList";
import type { CatalogueEntry } from "../../types";

const noop = () => {};

/** The list under a read-only field, as Combobox and TagInput mount it: the field's wrapper is the positioned parent. */
function Sample(p: { label: string; value: string; items: string[]; active: number }) {
  const id = useId();
  return (
    <div className="text-field combobox">
      <input aria-label={p.label.replace(" suggestions", "")} value={p.value} readOnly />
      <SuggestionList id={id} label={p.label} items={p.items} active={p.active} onPick={noop} onClose={noop} />
    </div>
  );
}
const TAGS = ["client-site", "internal", "prototype", "wordpress"];
const MANY = ["astro", "docker", "electron", "go", "node", "php", "python", "react", "rust", "svelte", "typescript", "vite", "vue", "wordpress"];

export const entry = {
  id: "suggestion-list",
  title: "SuggestionList",
  family: "overlays",
  source: "renderer/components/common/SuggestionList.tsx",
  exports: ["SuggestionList", "optionId"],
  purpose: "The listbox that drops under a text input to offer matching values. It is internal to Combobox and TagInput: screens use those two and never render this list themselves.",
  useFor: [
    "Building another input that suggests strings while the input keeps focus (it points at the highlighted row with aria-activedescendant, using optionId).",
    "Reading how Combobox (project category) and TagInput (project tags) show their suggestions.",
  ],
  notFor: [
    "A category or tag field on a screen: use Combobox or TagInput, which own the filtering and the keyboard.",
    "Picking from a fixed list with a button: use Dropdown, which takes focus into its menu.",
    "Rows that are not plain strings: the list only renders text.",
  ],
  snippet: "{showing && (\n  <SuggestionList\n    id={`${id}-list`}\n    label=\"Category suggestions\"\n    items={items}\n    active={active}\n    onPick={pick}\n    onHover={setActive}\n    onClose={() => setOpen(false)}\n  />\n)}",
  specimens: [
    { label: "A few items, one active", minHeight: 210, render: () => <Sample label="Tag suggestions" value="i" items={TAGS} active={1} /> },
    { label: "Long list scrolls", minHeight: 290, render: () => <Sample label="Stack suggestions" value="" items={MANY} active={0} /> },
    { label: "Long item", minHeight: 90, render: () => <Sample label="Category suggestions" value="Client" items={["Client work for a regional hospitality group"]} active={-1} /> },
  ],
  notes: [
    "The list is positioned top: 100% inside its parent, so the parent must be position relative. It caps at 240px and scrolls.",
    "A mounted list is its own dismiss layer: Escape calls onClose and does not reach a dialog around it. Mount it only while it is showing.",
    "Rows keep the input's focus (mousedown is prevented), and the active row has an accent bar on its left edge.",
  ],
} satisfies CatalogueEntry;
