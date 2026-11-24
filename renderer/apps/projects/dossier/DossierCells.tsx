import type { ProjectLinkKey } from "../../../../shared/projects/record";
import type { ProjectView } from "../../../../shared/projects/view";
import { Badge } from "../../../components/common/Badge";
import { Button } from "../../../components/common/Button";
import { IconButton } from "../../../components/common/IconButton";
import { KeyValue, KeyValueList } from "../../../components/common/KeyValue";
import { MosaicCell } from "../../../components/common/Mosaic";
import { gitInfo, linkKeys, splitFolder, stackLabel } from "../cardModel";
import type { CardActions } from "../ProjectCard";
import { GitRows, NoneText, OpenActions, ProjectLinks } from "../ProjectParts";
import { relativeTime } from "../projectsModel";
import { formatDate, hasSiteDetails, remoteLabel, siteRows, timeline } from "./dossierModel";


export function SiteCell({ p, onEdit }: { p: ProjectView; onEdit(): void }) {
  const rows = siteRows(p);
  return (
    <MosaicCell label="Site" span={4} narrowSpan={6}>
      {rows.length > 0 ? (
        <KeyValueList>{rows.map((r) => <KeyValue key={r.key} label={r.label}>{r.value}</KeyValue>)}</KeyValueList>
      ) : (
        <>
          <p className="projects-dossier-muted">{hasSiteDetails(p) ? "No client, hosting or launch date" : "No site details yet"}</p>
          <div><Button variant="quiet" icon="pencil" onClick={onEdit}>{hasSiteDetails(p) ? "Edit site details" : "Add site details"}</Button></div>
        </>
      )}
    </MosaicCell>
  );
}

export function GitCell({ p, now }: { p: ProjectView; now: number }) {
  const git = gitInfo(p);
  const remote = remoteLabel(p.detected.repo);
  return (
    <MosaicCell label="Git" span={4} narrowSpan={6}>
      {git === "none" && !p.branch ? <p className="projects-dossier-muted">Git: None</p> : (
        <KeyValueList>
          <GitRows project={p} now={now} />
          {remote && <KeyValue label="Remote">{remote}</KeyValue>}
        </KeyValueList>
      )}
    </MosaicCell>
  );
}

function Group({ label, items, tag }: { label: string; items: readonly string[]; tag?: boolean }) {
  return (
    <div className="projects-dossier-group">
      <span className="label projects-dossier-sub">{label}</span>
      {items.length === 0 ? <NoneText /> : <div className="chip-row projects-dossier-chips">{items.map((s) => <Badge key={s} variant={tag ? "tag" : undefined}>{s}</Badge>)}</div>}
    </div>
  );
}

export function StackCell({ p }: { p: ProjectView }) {
  return (
    <MosaicCell label="Stack and services" span={4}>
      <Group label="Stack" items={p.stack.map(stackLabel)} />
      <Group label="Services" items={p.site.services} tag />
    </MosaicCell>
  );
}

export function NotesCell({ p }: { p: ProjectView }) {
  const notes = p.site.notes.trim();
  return (
    <MosaicCell label="Notes" span={8}>
      {notes ? <p className="projects-dossier-notes">{p.site.notes}</p> : <p className="projects-dossier-muted">No notes</p>}
    </MosaicCell>
  );
}

export function LinksCell({ p, onOpen }: { p: ProjectView; onOpen(key: ProjectLinkKey): void }) {
  const keys = linkKeys(p);
  return (
    <MosaicCell label="Links" span={4}>
      {keys.length === 0 ? <p className="projects-dossier-muted">No links</p> : (
        <div className="projects-dossier-links">
          <ProjectLinks project={p} onOpen={onOpen} />
        </div>
      )}
    </MosaicCell>
  );
}

export function TimelineCell({ p, now }: { p: ProjectView; now: number }) {
  return (
    <MosaicCell label="Timeline" span={12}>
      <ol className="projects-dossier-timeline">
        {timeline(p).map((e) => (
          <li key={e.key} className="projects-dossier-event">
            <span className="projects-dossier-event-mark" aria-hidden="true" />
            <span className="label">{e.label}</span>
            <span className="projects-dossier-event-date" title={new Date(e.at).toLocaleString()}>{formatDate(e.at)}</span>
            <span className="projects-dossier-muted">{relativeTime(e.at, now)}</span>
          </li>
        ))}
      </ol>
    </MosaicCell>
  );
}

export function LocationCell({ p, actions: a }: { p: ProjectView; actions: CardActions }) {
  const folder = splitFolder(p.folder);
  return (
    <MosaicCell label="Location" span={12}>
      <div className="projects-dossier-location">
        <span className="projects-dossier-path" title={p.folder}>
          {folder.head && <span className="projects-dossier-path-head">{folder.head}</span>}
          <strong>{folder.tail}</strong>
        </span>
        <span className="projects-dossier-actions">
          <OpenActions project={p} labels="all" onOpen={(t) => a.open(p.id, t)} />
          <IconButton icon="copy" label="Copy path" onClick={() => a.copyPath(p.id)} />
        </span>
      </div>
    </MosaicCell>
  );
}
