import { Combobox } from "../../../../components/common/Combobox";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

const noop = () => {};
const HOSTS = ["Netlify", "Cloudflare Pages", "WP Engine", "Vercel", "DigitalOcean"];

export const entry = {
  id: "combobox",
  title: "Combobox",
  family: "inputs",
  source: "renderer/components/common/Combobox.tsx",
  exports: ["Combobox"],
  purpose: "A single-value text input with a list of suggestions under it. The owner can pick a suggestion or type anything else: free text is always allowed, the list only helps.",
  useFor: [
    "A project category, suggested from the categories already used.",
    "A resource link's group (Hosting, Design) and a site's hosting provider.",
    "Any one value that repeats across records and where a new value must still be possible.",
  ],
  notFor: [
    "Several values at once, such as tags or services: use TagInput.",
    "A value that must be one of a fixed set: use Dropdown or Segmented. A Combobox never rejects what is typed.",
    "A plain value with no useful suggestions, such as a name or an address: use TextField.",
  ],
  snippet: "<Combobox\n  label=\"Category\"\n  value={draft.category}\n  onChange={(v) => set(\"category\", v)}\n  suggestions={categories}\n  placeholder=\"Uncategorised\"\n  maxLength={PROJECT_LIMITS.category}\n/>",
  specimens: [
    { label: "Empty with placeholder", render: () => <Combobox label="Category" value="" suggestions={HOSTS} placeholder="Uncategorised" onChange={noop} /> },
    { label: "With a value", render: () => <Combobox label="Hosting" value="Netlify" suggestions={HOSTS} onChange={noop} /> },
    { label: "Open with suggestions", minHeight: 280, render: () => <Combobox label="Hosting" value="" suggestions={HOSTS} defaultOpen onChange={noop} /> },
    { label: "Open, filtered by the value", minHeight: 150, render: () => <Combobox label="Hosting" value="net" suggestions={HOSTS} defaultOpen onChange={noop} /> },
    { label: "No matches (list stays closed)", render: () => <Combobox label="Hosting" value="Fly.io" suggestions={HOSTS} defaultOpen onChange={noop} /> },
    { label: "Hidden label", notInUse: true, render: () => <Combobox label="Group" hideLabel value="" suggestions={HOSTS} placeholder="Group" onChange={noop} /> },
    { label: "With an error message", notInUse: true, render: () => <Combobox label="Category" value="" suggestions={HOSTS} error="Pick or type a category." onChange={noop} /> },
    {
      label: "Live: type or pick", minHeight: 280,
      render: () => (
        <Live initial="">
          {(value, set) => <Combobox label="Hosting" value={value} suggestions={HOSTS} placeholder="Optional, such as Netlify" onChange={set} />}
        </Live>
      ),
    },
  ],
  notes: [
    "onChange fires on every keystroke and on a pick, so the value is always what is in the box. There is no separate selected state.",
    "The list shows the suggestions that contain the typed text (prefix matches first, at most 8, case ignored). An empty value matches all of them. When nothing matches the list does not render, which is also what the no-match specimen shows.",
    "Keys: Arrow Down opens and moves, Enter picks the highlighted row, Escape closes the list, and the first Escape does not reach a dialog around it. Enter with no highlighted row does nothing here, and a comma is just a character. Blur closes the list.",
    "defaultOpen exists for this page only. Screens never pass it.",
  ],
} satisfies CatalogueEntry;
