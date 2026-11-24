import { Badge } from "../../../../components/common/Badge";
import { KeyValue, KeyValueList } from "../../../../components/common/KeyValue";
import { Mosaic, MosaicCell } from "../../../../components/common/Mosaic";
import type { ReactNode } from "react";
import type { CatalogueEntry } from "../../types";

function facts(): ReactNode {
  return (
    <KeyValueList>
      <KeyValue label="Client">Harbor Dental</KeyValue>
      <KeyValue label="Hosting">Netlify</KeyValue>
    </KeyValueList>
  );
}

function sample(): ReactNode {
  return (
    <Mosaic aria-label="Project file">
      <MosaicCell as="div" span={12}><p className="kicker">File 0123-4567</p></MosaicCell>
      <MosaicCell label="Identity" span={6}><p>project-ops</p><p className="styleguide-muted">Desktop organizer</p></MosaicCell>
      <MosaicCell label="Status" span={3} narrowSpan={6}><div className="styleguide-row"><Badge>Active</Badge></div></MosaicCell>
      <MosaicCell label="Serial" span={3} narrowSpan={6}><p>0123-4567</p></MosaicCell>
      <MosaicCell label="Site" span={4} narrowSpan={6}>{facts()}</MosaicCell>
      <MosaicCell label="Git" span={4} narrowSpan={6}>
        <KeyValueList><KeyValue label="Branch">main</KeyValue><KeyValue label="Last commit">3 days ago</KeyValue></KeyValueList>
      </MosaicCell>
      <MosaicCell label="Notes" span={4} narrowSpan={12}><p>Launch moved to spring.</p></MosaicCell>
    </Mosaic>
  );
}

export const entry = {
  id: "mosaic",
  title: "Mosaic",
  family: "layout",
  source: "renderer/components/common/Mosaic.tsx",
  exports: ["Mosaic", "MosaicCell"],
  purpose: "One sheet divided into cells by hairlines on a 12-column grid. It answers to its own width through container queries, so cells re-flow in a narrow window.",
  useFor: [
    "The project page: file plate, identity, status, serial, site, git, stack, notes and links as cells of one sheet.",
    "Any page of related facts that should read as one document rather than separate objects.",
    "Cells that need a kicker label with a small control at the end.",
  ],
  notFor: [
    "Separate objects with gaps between them, such as the project grid: use Card.",
    "A boxed form section: use Panel.",
    "Two resizable panes: use SplitPane.",
  ],
  snippet: "<Mosaic aria-label=\"Project file\">\n  <MosaicCell label=\"Status\" span={3} narrowSpan={6}>\n    <Badge>Active</Badge>\n  </MosaicCell>\n  <MosaicCell label=\"Git\" span={4} narrowSpan={6}>\n    <KeyValueList>...</KeyValueList>\n  </MosaicCell>\n</Mosaic>",
  specimens: [
    { label: "Full width", wide: true, render: sample },
    { label: "640 px: cells take narrowSpan", width: 640, render: sample },
    { label: "420 px: one column", width: 420, render: sample },
    {
      label: "Label and end slot", wide: true,
      render: () => (
        <Mosaic aria-label="End slot">
          <MosaicCell label="Site" span={6} end={<Badge>Live</Badge>}>{facts()}</MosaicCell>
          <MosaicCell label="Notes" span={6} end={<span className="styleguide-small">Plain text</span>}><p>Hosting renews in June.</p></MosaicCell>
        </Mosaic>
      ),
      notInUse: true,
    },
    {
      label: "Row span", wide: true,
      render: () => (
        <Mosaic aria-label="Row span">
          <MosaicCell label="Notes" span={6} rowSpan={2}><p>Client wants the footer changed before launch. Check the redirects with the new domain.</p></MosaicCell>
          <MosaicCell label="Git" span={6}><p>main</p></MosaicCell>
          <MosaicCell label="Stack" span={6}><p>TypeScript, React</p></MosaicCell>
        </Mosaic>
      ),
      notInUse: true,
    },
    {
      label: "Tone accent and muted", wide: true, notInUse: true,
      render: () => (
        <Mosaic aria-label="Tones">
          <MosaicCell label="Accent" span={6} tone="accent"><p>Raised surface</p></MosaicCell>
          <MosaicCell label="Muted" span={6} tone="muted"><p>Muted tone</p></MosaicCell>
        </Mosaic>
      ),
    },
  ],
  notes: [
    "Only the Mosaic aria-label, label, span, narrowSpan, as and className props are used by screens. end, rowSpan and tone are not passed anywhere.",
    "Under 720 px a cell takes narrowSpan (6 or 12, default 12); pair halves so no hole is left. Under 480 px every cell is a full row.",
    "A cell is a section named by its label; pass as=\"div\" for a cell without a label, such as the file plate.",
  ],
} satisfies CatalogueEntry;
