import { ColourSwatches, ContrastTable, type SwatchSpec } from "../../FoundationParts";
import type { CatalogueEntry } from "../../types";

const BASE: SwatchSpec[] = [
  { name: "bg", role: "Page background" },
  { name: "surface", role: "Cards and panels" },
  { name: "surface-raised", role: "Raised cells, selected controls" },
  { name: "text", role: "Body text and headings" },
  { name: "text-muted", role: "Secondary text, control borders" },
  { name: "line", role: "Decorative hairlines" },
  { name: "accent", role: "Fills, bars and status lights" },
  { name: "accent-text", role: "The accent used as text or a thin line" },
  { name: "accent-ink", role: "Text on an accent fill" },
  { name: "danger", role: "Errors and destructive actions" },
  { name: "danger-ink", role: "Text on a danger fill" },
  { name: "success", role: "Done and healthy" },
];

const DERIVED: SwatchSpec[] = [
  { name: "hover", role: "Pointer over a control" },
  { name: "pressed", role: "Control held down" },
  { name: "selected", role: "Selected row or option" },
  { name: "scrim", role: "Behind dialogs" },
  { name: "grid", role: "Drafting grid", unused: true },
  { name: "control-border", role: "Edges of controls" },
  { name: "focus", role: "Keyboard focus ring" },
  { name: "glitch-a", role: "Primary button split, first copy" },
  { name: "glitch-b", role: "Primary button split, second copy" },
];

export const entry = {
  id: "colour",
  title: "Colour",
  family: "foundations",
  source: "renderer/theme/themes/kojima.css",
  exports: ["renderer/theme/tokens.css", "renderer/theme/tokenList.ts", "renderer/theme/color.ts"],
  purpose: "Twelve base colours per mode, set by the theme file. Everything else is derived from them, so a new theme or an accent override changes the whole interface.",
  useFor: ["Any colour in a style rule, by token name.", "Checking that a new pairing is readable before using it."],
  notFor: ["Raw hex or rgba outside renderer/theme/.", "Telling states apart by colour alone."],
  snippet: ".projects-card { background: var(--surface); color: var(--text); border: var(--line-w) solid var(--line); }",
  specimens: [
    { label: "Base palette", wide: true, render: () => <ColourSwatches tokens={BASE} showHex /> },
    { label: "Derived colours", wide: true, render: () => <ColourSwatches tokens={DERIVED} showHex={false} /> },
    { label: "Contrast of the pairs the interface uses", wide: true, render: () => <ContrastTable /> },
  ],
  notes: ["Hex values are read from the frame they sit in, so Dark and Light show their own."],
} satisfies CatalogueEntry;
