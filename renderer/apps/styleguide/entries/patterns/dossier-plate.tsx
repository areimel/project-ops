import { Mosaic, MosaicCell } from "../../../../components/common/Mosaic";
import { Barcode, DotGrid, HazardBand, RegMarks, Stamp } from "../../../projects/dossier/DossierGraphics";
import { fileSerial } from "../../../projects/dossier/dossierModel";
import { PROJECTS } from "../../fixtures";
import type { CatalogueEntry } from "../../types";

const P = PROJECTS.pinned;
const SERIAL = fileSerial(P.id);

export const entry = {
  id: "dossier-plate",
  title: "Dossier plate graphics",
  family: "patterns",
  source: "renderer/apps/projects/dossier/DossierGraphics.tsx",
  exports: ["HazardBand", "Barcode", "RegMarks", "Stamp", "DotGrid"],
  purpose: "The decoration of a project's file plate: a hazard band with a serial, registration marks, a status stamp, a barcode drawn from the id and a dot grid. They give the project page and this catalogue's header their technical-file look.",
  useFor: [
    "A record's title plate on the project page, and this catalogue's header.",
    "Stamp for a record's status, in the tone cardStatus gives (accent, muted, danger).",
    "Barcode and serial as a record's identity mark: both derive from the id with barcodeBars and fileSerial.",
  ],
  notFor: [
    "Ordinary sections, toolbars, cards or dialogs: they use the kicker head and hairlines only.",
    "A status that shares a row with other text: use StatusDot or Badge.",
    "Anything that is not a record's own page: the plate marks one thing as the file in front of you.",
  ],
  snippet: "<MosaicCell as=\"div\" span={12} className=\"projects-dossier-plate\">\n  <HazardBand>File {fileSerial(p.id)}</HazardBand>\n</MosaicCell>\n<MosaicCell as=\"div\" span={6} className=\"projects-dossier-identity\">\n  <RegMarks />\n  ...\n</MosaicCell>\n<MosaicCell label=\"Status\" span={3} className=\"projects-dossier-status\">\n  <Stamp tone={status.tone}>{status.label}</Stamp>\n</MosaicCell>\n<MosaicCell label=\"Serial\" span={3}>\n  <Barcode id={p.id} /> <DotGrid />\n</MosaicCell>",
  specimens: [
    { label: "Hazard band", wide: true, render: () => <HazardBand>File {SERIAL}</HazardBand> },
    {
      label: "Stamp in its four tones",
      render: () => (
        <div className="styleguide-row">
          <Stamp tone="accent">Active</Stamp>
          <Stamp tone="success">Live</Stamp>
          <Stamp tone="muted">Paused</Stamp>
          <Stamp tone="danger">Folder missing</Stamp>
        </div>
      ),
    },
    {
      label: "Barcode and dot grid",
      width: 280,
      render: () => (
        <div className="styleguide-stack">
          <Barcode id={P.id} />
          <span className="projects-dossier-serial">{SERIAL}</span>
          <DotGrid />
        </div>
      ),
    },
    {
      label: "Registration marks need a positioned box with padding",
      width: 280,
      render: () => (
        <div style={{ position: "relative", padding: 32, minHeight: 96 }}>
          <RegMarks />
          <span className="kicker">Clients</span>
        </div>
      ),
    },
    {
      label: "The assembled plate",
      wide: true,
      render: () => (
        <Mosaic className="projects-dossier-mosaic" aria-label="File plate">
          <MosaicCell as="div" span={12} className="projects-dossier-plate"><HazardBand>File {SERIAL}</HazardBand></MosaicCell>
          <MosaicCell as="div" span={6} className="projects-dossier-identity">
            <RegMarks />
            <span className="kicker">{P.category}</span>
            <h1 className="projects-dossier-name">{P.name}</h1>
          </MosaicCell>
          <MosaicCell label="Status" span={3} narrowSpan={6} className="projects-dossier-status"><Stamp tone="accent">Active</Stamp></MosaicCell>
          <MosaicCell label="Serial" span={3} narrowSpan={6}>
            <Barcode id={P.id} />
            <span className="projects-dossier-serial">{SERIAL}</span>
            <span className="projects-dossier-origin">Found by scan</span>
            <DotGrid />
          </MosaicCell>
        </Mosaic>
      ),
    },
  ],
  notes: [
    "These are decoration reserved for a record's title plate and this catalogue's header. Do not add them to ordinary sections.",
    "RegMarks places four marks in the nearest positioned ancestor, so the box needs position: relative and padding (the identity cell's class gives both). HazardBand, Barcode, Stamp and DotGrid are hidden from assistive technology except Stamp, which carries text.",
    "Helpers: fileSerial(id) gives PO-XXXX-XXXX-XXXX; barcodeBars(id) gives the bars. Both are pure and tested in dossierModel.ts.",
  ],
} satisfies CatalogueEntry;
