import { Button } from "../../../../components/common/Button";
import { Icon } from "../../../../components/common/Icon";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "icon",
  title: "Icon",
  family: "display",
  source: "renderer/components/common/Icon.tsx",
  exports: ["Icon", "IconName", "ICON_NAMES"],
  purpose: "One line glyph from the project's own set, drawn in currentColor so it takes the colour of the text or control around it. It is decorative (aria-hidden): the words next to it or the label of its button carry the meaning.",
  useFor: [
    "A leading mark in a Button: the icon prop passes a name and sizes it to 16.",
    "A small mark beside text: the pinned mark on a card, the arrow on a link that opens outside the app.",
    "The glyph in an empty state, at size 28.",
  ],
  notFor: [
    "A control with no visible text: use IconButton, which requires a label.",
    "A coloured status or a count: use Badge or StatusDot.",
    "An illustration or a logo: the set is one 24-pixel line glyph per name, with no colour of its own.",
  ],
  snippet: "<Icon name=\"folder\" />\n<Icon name=\"pin\" size={14} />",
  specimens: [
    {
      label: "Sizes",
      render: () => (
        <div className="styleguide-row">
          <span className="styleguide-small styleguide-inline"><Icon name="pin" size={16} /> 16</span>
          <span className="styleguide-small styleguide-inline"><Icon name="pin" /> 20 (default)</span>
          <span className="styleguide-small styleguide-inline"><Icon name="pin" size={28} /> 28</span>
        </div>
      ),
    },
    {
      label: "Inherits colour",
      render: () => (
        <div className="styleguide-row">
          <Icon name="info" />
          <span className="styleguide-muted styleguide-inline"><Icon name="info" /> Muted text colour</span>
          <Button variant="primary" icon="warning">Accent ink</Button>
          <Button variant="danger" icon="trash">Danger ink</Button>
        </div>
      ),
    },
    {
      label: "Names in use",
      render: () => (
        <div className="styleguide-row">
          <Icon name="folder" />
          <Icon name="terminal" />
          <Icon name="code" />
          <Icon name="pin" />
          <Icon name="pencil" />
          <Icon name="copy" />
          <Icon name="plus" />
          <Icon name="refresh" />
          <Icon name="trash" />
          <Icon name="check" />
          <Icon name="warning" />
          <Icon name="arrowUpRight" />
        </div>
      ),
    },
    {
      label: "With text", wide: true,
      render: () => (
        <p>
          <span className="styleguide-inline"><Icon name="pin" size={14} /> Pinned</span>, and{" "}
          <span className="styleguide-inline">a link that opens outside the app <Icon name="arrowUpRight" size={12} /></span>
        </p>
      ),
    },
  ],
  notes: [
    "The full set is in the foundations sheet \"icons\". Icon has no colour prop: set the colour on the parent.",
    "Sizes used in the app are 12, 14, 16, 18 and 28; the default 20 is what IconButton uses.",
  ],
} satisfies CatalogueEntry;
