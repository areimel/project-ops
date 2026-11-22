import { useEffect, useRef } from "react";
import type { ProjectView } from "../../../../shared/projects/view";
import { Badge } from "../../../components/common/Badge";
import { Button } from "../../../components/common/Button";
import { EmptyState } from "../../../components/common/EmptyState";
import { Icon } from "../../../components/common/Icon";
import { IconButton } from "../../../components/common/IconButton";
import { Mosaic, MosaicCell } from "../../../components/common/Mosaic";
import { cardCategory, cardStatus } from "../cardModel";
import type { CardActions } from "../ProjectCard";
import { GitCell, LinksCell, LocationCell, NotesCell, SiteCell, StackCell, TimelineCell } from "./DossierCells";
import { Barcode, DotGrid, HazardBand, RegMarks, Stamp } from "./DossierGraphics";
import { fileSerial } from "./dossierModel";
import "./dossier.css";

export interface DossierProps {
  project: ProjectView | null;
  now: number;
  actions: CardActions;
  onBack(): void;
}

/** One project as a technical file: identity, status, site, git, stack, notes, links, timeline and location. */
export function ProjectDossier({ project: p, now, actions: a, onBack }: DossierProps) {
  // Opening a project moves focus to its name, so keyboard and screen-reader users land on the page they opened.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const id = p?.id;
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [id]);
  if (!p) {
    return (
      <div className="projects-dossier">
        <div className="projects-dossier-scroll">
          <EmptyState icon="folder" title="This project is not in the list"
            action={<Button variant="quiet" onClick={onBack}>All projects</Button>} />
        </div>
      </div>
    );
  }
  const status = cardStatus(p);
  const serial = fileSerial(p.id);
  return (
    <div className="projects-dossier">
      <div className="projects-dossier-bar">
        <Button variant="quiet" onClick={onBack}>All projects</Button>
        <span className="projects-dossier-bar-end">
          <Button variant="quiet" icon="refresh" onClick={() => a.refresh(p.id)}>Refresh</Button>
          <IconButton icon="pin" label={p.pinned ? "Unpin" : "Pin to the top"} aria-pressed={p.pinned} onClick={() => a.togglePin(p.id)} />
          <Button variant="quiet" icon="pencil" onClick={() => a.edit(p.id)}>Edit</Button>
        </span>
      </div>
      <div className="projects-dossier-scroll">
        <Mosaic className="projects-dossier-mosaic" aria-label="Project file">
          <MosaicCell as="div" span={12} className="projects-dossier-plate"><HazardBand>File {serial}</HazardBand></MosaicCell>

          <MosaicCell as="div" span={6} className="projects-dossier-identity">
            <RegMarks />
            <span className="kicker">{cardCategory(p)}</span>
            <h1 className="projects-dossier-name" tabIndex={-1} ref={headingRef}>{p.name}</h1>
            {p.description && <p className="projects-dossier-desc">{p.description}</p>}
            {(p.tags.length > 0 || p.pinned) && (
              <div className="projects-dossier-chips">
                {p.pinned && <span className="projects-dossier-pin"><Icon name="pin" size={14} /> Pinned</span>}
                {p.tags.map((t) => <Badge key={t}>{t}</Badge>)}
              </div>
            )}
          </MosaicCell>

          <MosaicCell label="Status" span={3} narrowSpan={6} className="projects-dossier-status">
            <Stamp tone={status.tone}>{status.label}</Stamp>
          </MosaicCell>

          <MosaicCell label="Serial" span={3} narrowSpan={6}>
            <Barcode id={p.id} />
            <span className="projects-dossier-serial">{serial}</span>
            <span className="projects-dossier-origin">{p.origin === "scan" ? "Found by scan" : "Added by hand"}</span>
            <DotGrid />
          </MosaicCell>

          <SiteCell p={p} onEdit={() => a.edit(p.id)} />
          <GitCell p={p} now={now} />
          <StackCell p={p} />
          <NotesCell p={p} />
          <LinksCell p={p} onOpen={(k) => a.openLink(p.id, k)} />
          <TimelineCell p={p} now={now} />
          <LocationCell p={p} actions={a} />
        </Mosaic>
      </div>
    </div>
  );
}
