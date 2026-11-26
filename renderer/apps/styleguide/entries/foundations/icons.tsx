import { ICON_NAMES, Icon } from "../../../../components/common/Icon";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "icons",
  title: "Icons",
  family: "foundations",
  source: "renderer/components/common/Icon.tsx",
  exports: ["Icon", "IconName", "ICON_NAMES"],
  purpose: "One line weight, square caps, a 24 by 24 grid. Drawn for this app, no icon library. Icons take the colour of the text around them.",
  useFor: ["Icon-only buttons through IconButton, with a label.", "A leading mark in a button or list row."],
  notFor: ["Decoration beside a heading.", "Meaning without a text label or tooltip."],
  snippet: "<Icon name=\"search\" size={16} />",
  specimens: [
    {
      label: "All icons at 20 and 16", wide: true,
      render: () => (
        <ul className="styleguide-icons">
          {ICON_NAMES.map((n) => (
            <li key={n} className="styleguide-icon">
              <span className="styleguide-icon-pair"><Icon name={n} size={20} /><Icon name={n} size={16} /></span>
              <code>{n}</code>
            </li>
          ))}
        </ul>
      ),
    },
  ],
} satisfies CatalogueEntry;
