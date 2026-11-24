import { Panel, PanelHeader } from "../../../../components/common/Panel";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "panel",
  title: "Panel",
  family: "overlays",
  source: "renderer/components/common/Panel.tsx",
  exports: ["Panel", "PanelHeader"],
  purpose: "A floating surface with a raised fill, a 1px line and a header row, for menus and side panels that sit over the page. Position it with className; it draws no shadow, only the line.",
  useFor: [
    "A floating menu or side panel that a screen opens over its content.",
    "A header row with a title and an optional action, using PanelHeader.",
  ],
  notFor: [
    "A modal that blocks the screen: use Dialog.",
    "A message after an action: use Toast.",
    "A plain block of content on the page: use Card or a styled div.",
  ],
  snippet: "<Panel className=\"sort-menu\" onDismiss={close}>\n  <PanelHeader title=\"Sort\" />\n  ...\n</Panel>",
  specimens: [
    {
      label: "With header", width: 280,
      render: () => (
        <Panel>
          <PanelHeader title="Sort" />
          <p className="styleguide-muted">Panel body</p>
        </Panel>
      ),
    },
    {
      label: "Header with an action", width: 280,
      render: () => (
        <Panel>
          <PanelHeader title="Filters">
            <span className="styleguide-small">3 active</span>
          </PanelHeader>
          <p className="styleguide-muted">Panel body</p>
        </Panel>
      ),
    },
    {
      label: "Without a header", width: 280,
      render: () => (
        <Panel>
          <p className="styleguide-muted">A panel with no header</p>
        </Panel>
      ),
    },
  ],
  status: "not-in-use",
  notes: ["Nothing in the app renders Panel yet. Pass onDismiss to close it on Escape; the specimens leave it out."],
} satisfies CatalogueEntry;
