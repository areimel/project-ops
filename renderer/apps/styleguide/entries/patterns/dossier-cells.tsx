import { Badge } from "../../../../components/common/Badge";
import { Icon } from "../../../../components/common/Icon";
import { Mosaic, MosaicCell } from "../../../../components/common/Mosaic";
import { cardCategory, cardStatus } from "../../../projects/cardModel";
import { GitCell, LinksCell, LocationCell, NotesCell, SiteCell, StackCell, TimelineCell } from "../../../projects/dossier/DossierCells";
import { Barcode, DotGrid, HazardBand, RegMarks, Stamp } from "../../../projects/dossier/DossierGraphics";
import { fileSerial } from "../../../projects/dossier/dossierModel";
import type { ProjectView } from "../../../../../shared/projects/view";
import { FIXTURE_NOW, NOOP_CARD_ACTIONS, PROJECTS, fixtureProject } from "../../fixtures";
import type { CatalogueEntry } from "../../types";

const noop = () => {};
const EMPTY = fixtureProject({
  name: "Bare folder", description: "", category: "", tags: [], branch: null, lastCommitAt: null, dirty: null, stack: [],
  origin: "manual", lastOpenedAt: null, scannedAt: null,
});

/** The page as ProjectDossier builds it, minus the focus effect and the top bar. */
function page(p: ProjectView) {
  const status = cardStatus(p);
  const serial = fileSerial(p.id);
  return (
    <Mosaic className="projects-dossier-mosaic" aria-label="Project file">
      <MosaicCell as="div" span={12} className="projects-dossier-plate"><HazardBand>File {serial}</HazardBand></MosaicCell>
      <MosaicCell as="div" span={6} className="projects-dossier-identity">
        <RegMarks />
        <span className="kicker">{cardCategory(p)}</span>
        <h1 className="projects-dossier-name">{p.name}</h1>
        {p.description && <p className="projects-dossier-desc">{p.description}</p>}
        {(p.tags.length > 0 || p.pinned) && (
          <div className="chip-row projects-dossier-chips">
            {p.pinned && <span className="projects-dossier-pin"><Icon name="pin" size={14} /> Pinned</span>}
            {p.tags.map((t) => <Badge key={t} variant="tag">{t}</Badge>)}
          </div>
        )}
      </MosaicCell>
      <MosaicCell label="Status" span={3} narrowSpan={6} className="projects-dossier-status"><Stamp tone={status.tone}>{status.label}</Stamp></MosaicCell>
      <MosaicCell label="Serial" span={3} narrowSpan={6}>
        <Barcode id={p.id} />
        <span className="projects-dossier-serial">{serial}</span>
        <span className="projects-dossier-origin">{p.origin === "scan" ? "Found by scan" : "Added by hand"}</span>
        <DotGrid />
      </MosaicCell>
      <SiteCell p={p} onEdit={noop} />
      <GitCell p={p} now={FIXTURE_NOW} />
      <StackCell p={p} />
      <NotesCell p={p} />
      <LinksCell p={p} onOpen={noop} />
      <TimelineCell p={p} now={FIXTURE_NOW} />
      <LocationCell p={p} actions={NOOP_CARD_ACTIONS} />
    </Mosaic>
  );
}

export const entry = {
  id: "dossier-cells",
  title: "Dossier cells",
  family: "patterns",
  source: "renderer/apps/projects/dossier/DossierCells.tsx",
  exports: ["SiteCell", "GitCell", "StackCell", "NotesCell", "LinksCell", "TimelineCell", "LocationCell", "Mosaic", "MosaicCell"],
  purpose: "The cells of the project page, each a MosaicCell fed by one ProjectView. They sit inside one Mosaic under the file plate, so a project reads as a single technical file.",
  useFor: [
    "The project page: site, git, stack and services, notes, links, timeline and location, in that order.",
    "A new cell on that page: copy the shape of one (label, span and narrowSpan, a hint line when empty).",
    "Empty states inside a cell: a muted hint (\"Git: None\", \"No links\") and, where the owner can fix it, a quiet button.",
  ],
  notFor: [
    "Another screen's facts as separate objects: use Card, as the project grid does.",
    "The page toolbar or the dialog form: see Toolbars and Dialog form.",
    "Rendering ProjectDossier itself in a catalogue: it moves focus to its heading on mount.",
  ],
  snippet: "<Mosaic className=\"projects-dossier-mosaic\" aria-label=\"Project file\">\n  <SiteCell p={p} onEdit={() => a.edit(p.id)} />\n  <GitCell p={p} now={now} />\n  <StackCell p={p} />\n  <NotesCell p={p} />\n  <LinksCell p={p} onOpen={(k) => a.openLink(p.id, k)} />\n  <TimelineCell p={p} now={now} />\n  <LocationCell p={p} actions={a} />\n</Mosaic>",
  specimens: [
    { label: "A project with site details", wide: true, render: () => page(PROJECTS.pinned) },
    { label: "No git, no site details", wide: true, render: () => page(EMPTY) },
    { label: "Narrow page, 640 px", width: 640, render: () => page(PROJECTS.dirty) },
  ],
  notes: [
    "Spans: Site, Git, Stack and Links take 4; Notes takes 8; Timeline and Location take 12. Site and Git have narrowSpan 6 so they pair under 720 px; the rest fall to a full row.",
    "Data comes from pure helpers: siteRows, hasSiteDetails, timeline and remoteLabel in dossierModel.ts; gitInfo, linkKeys and stackLabel in cardModel.ts. Cells hold no branching of their own beyond empty versus filled.",
    "Cell classes (projects-dossier-*) live in dossier.css and need no ancestor. The specimens add no wrapper and should match the real page apart from the scroll area padding.",
  ],
} satisfies CatalogueEntry;
