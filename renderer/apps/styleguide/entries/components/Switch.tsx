import { Field } from "../../../../components/common/Field";
import { Switch } from "../../../../components/common/Switch";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "switch",
  title: "Switch",
  family: "inputs",
  source: "renderer/components/common/Switch.tsx",
  exports: ["Switch"],
  purpose: "A square on/off toggle for one setting that takes effect at once. Use it where a setting is either on or off, and say what it is in the label beside it.",
  useFor: [
    "A yes/no setting in Settings, such as Close to tray.",
    "A flag on a form, such as Pin to the top in the project dialog.",
  ],
  notFor: [
    "Choosing between three or more options: use Segmented.",
    "A value on a continuous range: use Slider.",
    "An action that runs once: use Button.",
  ],
  snippet: "<Switch checked={closeToTray} label=\"Close to tray\"\n  onChange={setCloseToTray} />",
  specimens: [
    {
      label: "On",
      render: () => (
        <Live initial={true}>{(on, set) => <Switch checked={on} label="Pin to the top" onChange={set} />}</Live>
      ),
    },
    {
      label: "Off",
      render: () => (
        <Live initial={false}>{(on, set) => <Switch checked={on} label="Pin to the top" onChange={set} />}</Live>
      ),
    },
    {
      label: "In a field", wide: true,
      render: () => (
        <div className="styleguide-row">
          <Field label="Close to tray">
            <Live initial={true}>{(on, set) => <Switch checked={on} label="Close to tray" onChange={set} />}</Live>
          </Field>
          <Field label="Pinned">
            <Live initial={false}>{(on, set) => <Switch checked={on} label="Pin to the top" onChange={set} />}</Live>
          </Field>
        </div>
      ),
    },
  ],
  notes: ["Hover and focus are live: point at it or press Tab. Space and Enter toggle it."],
} satisfies CatalogueEntry;
