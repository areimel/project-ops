import { PROJECT_LINK_KEYS, type ProjectLinkKey } from "../../../../shared/projects/record";
import type { ProjectView } from "../../../../shared/projects/view";
import { Badge } from "../../../components/common/Badge";
import { Button } from "../../../components/common/Button";
import { Icon } from "../../../components/common/Icon";
import { IconButton } from "../../../components/common/IconButton";
import { KeyValue, KeyValueList } from "../../../components/common/KeyValue";
import { MosaicCell } from "../../../components/common/Mosaic";
import { GIT_UNREAD_NOTE, gitInfo, splitFolder, stackLabel } from "../cardModel";
import type { CardActions } from "../ProjectCard";
import { relativeTime } from "../projectsModel";
import { formatDate, hasSiteDetails, remoteLabel, siteRows, timeline } from "./dossierModel";

const LINK_LABELS: Record<ProjectLinkKey, string> = { repo: "Repo", site: "Site", docs: "Docs" };
const None = ({ children = "None" }: { children?: string }) => <span className="projects-none">{children}</span>;

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
          <KeyValue label="Branch" title={p.dirty ? `${p.branch ?? "No branch"}: uncommitted changes` : p.branch ?? undefined}>
            {p.branch ?? <None />}
            {p.dirty && <span className="bullet projects-dirty" title="Uncommitted changes"><span className="visually-hidden">, uncommitted changes</span></span>}
          </KeyValue>
          <KeyValue label="Last commit" title={git === "read" ? new Date(p.lastCommitAt!).toLocaleString() : GIT_UNREAD_NOTE}>
            {git === "read" ? relativeTime(p.lastCommitAt, now) : <None>Unknown</None>}
          </KeyValue>
          {remote && <KeyValue label="Remote">{remote}</KeyValue>}
        </KeyValueList>
      )}
    </MosaicCell>
  );
}

function Group({ label, items }: { label: string; items: readonly string[] }) {
  return (
    <div className="projects-dossier-group">
      <span className="label projects-dossier-sub">{label}</span>
      {items.length === 0 ? <None /> : <div className="projects-dossier-chips">{items.map((s) => <Badge key={s}>{s}</Badge>)}</div>}
    </div>
  );
}

export function StackCell({ p }: { p: ProjectView }) {
  return (
    <MosaicCell label="Stack and services" span={4}>
      <Group label="Stack" items={p.stack.map(stackLabel)} />
      <Group label="Services" items={p.site.services} />
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
  const keys = PROJECT_LINK_KEYS.filter((k) => p.links[k] !== null);
  return (
    <MosaicCell label="Links" span={4}>
      {keys.length === 0 ? <p className="projects-dossier-muted">No links</p> : (
        <div className="projects-dossier-links">
          {keys.map((k) => (
            <button key={k} type="button" className="projects-link" title={p.links[k] ?? undefined} onClick={() => onOpen(k)}>
              {LINK_LABELS[k]}<Icon name="arrowUpRight" size={12} />
            </button>
          ))}
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
  const gone = p.missing;
  return (
    <MosaicCell label="Location" span={12}>
      <div className="projects-dossier-location">
        <span className="projects-dossier-path" title={p.folder}>
          {folder.head && <span className="projects-dossier-path-head">{folder.head}</span>}
          <strong>{folder.tail}</strong>
        </span>
        <span className="projects-dossier-actions">
          <Button variant="quiet" icon="code" disabled={gone} onClick={() => a.open(p.id, "editor")}>Editor</Button>
          <Button variant="quiet" icon="terminal" disabled={gone} onClick={() => a.open(p.id, "terminal")}>Terminal</Button>
          <Button variant="quiet" icon="folder" disabled={gone} onClick={() => a.open(p.id, "folder")}>Folder</Button>
          <IconButton icon="copy" label="Copy path" onClick={() => a.copyPath(p.id)} />
        </span>
      </div>
    </MosaicCell>
  );
}
