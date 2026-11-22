import { memo } from "react";
import { PROJECT_LINK_KEYS, type OpenTarget, type ProjectLinkKey } from "../../../shared/projects/record";
import type { ProjectView } from "../../../shared/projects/view";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Card, CardBody, CardFooter, CardHeader } from "../../components/common/Card";
import { Icon } from "../../components/common/Icon";
import { IconButton } from "../../components/common/IconButton";
import { KeyValue, KeyValueList } from "../../components/common/KeyValue";
import { StatusDot } from "../../components/common/StatusDot";
import { GIT_UNREAD_NOTE, capList, cardCategory, cardMuted, cardStatus, gitInfo, splitFolder, stackLabel, traitRows } from "./cardModel";
import { relativeTime } from "./projectsModel";

/** Everything a card can ask for, addressed by project id so one stable object serves every card. */
export interface CardActions {
  open(id: string, target: OpenTarget): void;
  openLink(id: string, key: ProjectLinkKey): void;
  copyPath(id: string): void;
  togglePin(id: string): void;
  edit(id: string): void;
  show(id: string): void;
  refresh(id: string): void;
  filterTag(tag: string): void;
  filterCategory(category: string): void;
}

const LINK_LABELS: Record<ProjectLinkKey, string> = { repo: "Repo", site: "Site", docs: "Docs" };
const TAG_CAP = 6;

interface Props {
  project: ProjectView;
  selected: boolean;
  now: number;
  actions: CardActions;
}

function ProjectCardImpl({ project: p, selected, now, actions: a }: Props) {
  const status = cardStatus(p);
  const tags = capList(p.tags, TAG_CAP);
  const links = PROJECT_LINK_KEYS.filter((k) => p.links[k] !== null);
  const gone = p.missing;
  const category = cardCategory(p);
  const git = gitInfo(p);
  const folder = splitFolder(p.folder);
  const rows = new Set(traitRows(p));

  return (
    <Card as="li" className="projects-card" muted={cardMuted(p)} selected={selected} data-project-id={p.id} aria-label={p.name}>
      <CardHeader
        start={<button type="button" className="projects-card-cat" title={`Show ${category} only`}
          onClick={() => a.filterCategory(p.category)}>{category}</button>}
        end={<StatusDot tone={status.tone}>{status.label}</StatusDot>} />

      <CardBody className="projects-card-body">
        <h3 className="projects-card-name" title={p.name}>
          {p.pinned && <span className="projects-card-pin" title="Pinned"><Icon name="pin" size={14} /><span className="visually-hidden">Pinned: </span></span>}
          <button type="button" className="projects-card-name-text" title="Open project page" onClick={() => a.show(p.id)}>{p.name}</button>
        </h3>
        {p.description && <p className="projects-card-desc" title={p.description}>{p.description}</p>}
        {p.tags.length > 0 && (
          <div className="projects-card-chips">
            {tags.shown.map((t) => (
              <Badge key={t} className="projects-tag" title={`Show only ${t}`} onClick={() => a.filterTag(t)}>{t}</Badge>
            ))}
            {tags.more > 0 && <span className="projects-card-more label" title={p.tags.slice(TAG_CAP).join(", ")}>+{tags.more}</span>}
          </div>
        )}

        <KeyValueList className="projects-card-traits">
          {rows.has("git") && (
            <KeyValue label="Git" title="Not a git repository."><span className="projects-none">None</span></KeyValue>
          )}
          {rows.has("branch") && (
            <KeyValue label="Branch" title={p.dirty ? `${p.branch ?? "No branch"}: uncommitted changes` : p.branch ?? undefined}>
              {p.branch ?? <span className="projects-none">None</span>}
              {p.dirty && <span className="bullet projects-dirty" title="Uncommitted changes"><span className="visually-hidden">, uncommitted changes</span></span>}
            </KeyValue>
          )}
          {rows.has("lastCommit") && (
            <KeyValue label="Last commit" title={git === "read" ? new Date(p.lastCommitAt!).toLocaleString() : GIT_UNREAD_NOTE}>
              {git === "read" ? relativeTime(p.lastCommitAt, now) : <span className="projects-none">Unknown</span>}
            </KeyValue>
          )}
          {rows.has("stack") && <KeyValue label="Stack">{p.stack.map(stackLabel).join(", ")}</KeyValue>}
          <KeyValue label="Folder" title={p.folder}>
            <span className="projects-path">
              {folder.head && <span className="projects-path-head">{folder.head}</span>}
              <span className="projects-path-tail">{folder.tail}</span>
            </span>
          </KeyValue>
          {rows.has("links") && (
            <KeyValue label="Links" title="">
              {links.map((k) => (
                <button key={k} type="button" className="projects-link" title={p.links[k] ?? undefined} onClick={() => a.openLink(p.id, k)}>
                  {LINK_LABELS[k]}<Icon name="arrowUpRight" size={12} />
                </button>
              ))}
            </KeyValue>
          )}
        </KeyValueList>
      </CardBody>

      <CardFooter className="projects-card-foot">
        <Button variant="quiet" icon="code" className="projects-card-open" aria-label="Open in editor" title="Open in editor"
          disabled={gone} onClick={() => a.open(p.id, "editor")}>Editor</Button>
        <IconButton icon="folder" label="Open folder" disabled={gone} onClick={() => a.open(p.id, "folder")} />
        <IconButton icon="terminal" label="Open terminal here" disabled={gone} onClick={() => a.open(p.id, "terminal")} />
        <IconButton icon="copy" label="Copy path" onClick={() => a.copyPath(p.id)} />
        <span className="projects-card-foot-end">
          <IconButton icon="pin" label="Pin to the top" aria-pressed={p.pinned}
            onClick={() => a.togglePin(p.id)} />
          <IconButton icon="pencil" label="Edit project" onClick={() => a.edit(p.id)} />
        </span>
      </CardFooter>
    </Card>
  );
}

export const ProjectCard = memo(ProjectCardImpl);
