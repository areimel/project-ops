import { Slider } from "../../../../components/common/Slider";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "slider",
  title: "Slider",
  family: "inputs",
  source: "renderer/components/common/Slider.tsx",
  exports: ["Slider"],
  purpose: "A square track and thumb for picking a number inside a range, by pointer or keyboard. It is built for a value that has a clear low and high end, with an optional buffered part to show how much is already loaded.",
  useFor: [
    "A bounded number a reader sets by feel, with a readable value shown beside it.",
    "A progress-like value that also shows how far ahead the data already is, through buffered.",
    "A stepped value, such as a size in whole units, with step set so every pointer and key value snaps.",
  ],
  notFor: [
    "A choice between a few named options: use Segmented.",
    "An exact number: use a TextField with a number type.",
    "A yes/no setting: use Switch.",
  ],
  snippet: "<Slider label=\"Zoom\" value={zoom} min={50} max={200}\n  step={10} onChange={setZoom}\n  tooltip={(v) => `${v}%`} />",
  specimens: [
    {
      label: "At zero", width: 320,
      render: () => (
        <Live initial={0}>{(v, set) => <Slider label="Volume" value={v} max={100} onChange={set} />}</Live>
      ),
    },
    {
      label: "Middle", width: 320,
      render: () => (
        <Live initial={50}>{(v, set) => <Slider label="Volume" value={v} max={100} onChange={set} />}</Live>
      ),
    },
    {
      label: "At maximum", width: 320,
      render: () => (
        <Live initial={100}>{(v, set) => <Slider label="Volume" value={v} max={100} onChange={set} />}</Live>
      ),
    },
    {
      label: "Buffered", width: 320,
      render: () => (
        <Live initial={40}>
          {(v, set) => <Slider label="Loaded" value={v} buffered={70} max={100} onChange={set} valueText={(n) => `${n} percent`} />}
        </Live>
      ),
    },
    {
      label: "Stepped with tooltip", width: 320,
      render: () => (
        <Live initial={60}>
          {(v, set) => (
            <Slider label="Zoom" value={v} min={50} max={200} step={10} onChange={set} tooltip={(n) => `${n}%`} />
          )}
        </Live>
      ),
    },
  ],
  status: "not-in-use",
  notes: [
    "The tooltip shows on hover only, not on keyboard focus. Hover and focus are live: point at the track or press Tab.",
    "Arrow keys step by 1% of the range (or by the step), PageUp and PageDown by ten times that, Home and End go to the ends.",
  ],
} satisfies CatalogueEntry;
