import { Field } from "../../../../components/common/Field";
import { Segmented } from "../../../../components/common/Segmented";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

const STATUS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

const MODES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const RANGE = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

export const entry = {
  id: "segmented",
  title: "Segmented",
  family: "inputs",
  source: "renderer/components/common/Segmented.tsx",
  exports: ["Segmented", "SegmentOption"],
  purpose: "A row of tab-like options where exactly one is chosen, the chosen one underlined in the accent. Use it for a short, fixed set of choices that reads better side by side than in a menu.",
  useFor: [
    "A mode or status with two or three fixed values, such as Light, Dark and System in Appearance.",
    "The status of a project in the edit dialog: Active, Paused or Archived.",
  ],
  notFor: [
    "Yes/no settings: use Switch.",
    "Long lists or options that come from data: use a Dropdown or Combobox.",
    "Moving between screens: the title bar buttons do that.",
  ],
  snippet: "<Segmented label=\"Mode\" value={mode}\n  options={[{ value: \"light\", label: \"Light\" },\n    { value: \"dark\", label: \"Dark\" }]}\n  onChange={setMode} />",
  specimens: [
    {
      label: "Two options",
      render: () => (
        <Live initial={"light"}>{(v, set) => <Segmented label="Mode" options={MODES.slice(0, 2)} value={v} onChange={set} />}</Live>
      ),
    },
    {
      label: "Three options",
      render: () => (
        <Live initial={"active"}>{(v, set) => <Segmented label="Status" options={STATUS} value={v} onChange={set} />}</Live>
      ),
    },
    {
      label: "Four options",
      render: () => (
        <Live initial={"month"}>{(v, set) => <Segmented label="Range" options={RANGE} value={v} onChange={set} />}</Live>
      ),
    },
    {
      label: "In a field", wide: true,
      render: () => (
        <Field label="Mode">
          <Live initial={"system"}>{(v, set) => <Segmented label="Mode" options={MODES} value={v} onChange={set} />}</Live>
        </Field>
      ),
    },
  ],
  notes: ["Arrow keys move the choice and select it at once. Tab leaves the group."],
} satisfies CatalogueEntry;
