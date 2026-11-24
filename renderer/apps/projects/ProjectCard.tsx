import { memo } from "react";
import type { OpenTarget, ProjectLinkKey } from "../../../shared/projects/record";
import type { ProjectView } from "../../../shared/projects/view";
import { Badge } from "../../components/common/Badge";
import { Card, CardBody, CardFooter, CardHeader } from "../../components/common/Card";
import { Icon } from "../../components/common/Icon";
import { IconButton } from "../../components/common/IconButton";
import { KeyValue, KeyValueList } from "../../components/common/KeyValue";
import { StatusDot } from "../../components/common/StatusDot";
import { capList, cardCategory, cardMuted, cardStatus, splitFolder, stackLabel, traitRows } from "./cardModel";
import { GitRows, NoneText, OpenActions, ProjectLinks } from "./ProjectParts";

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
  const category = cardCategory(p);
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
          <div className="chip-row projects-card-chips">
            {tags.shown.map((t) => (
              <Badge key={t} variant="tag" title={`Show only ${t}`} onClick={() => a.filterTag(t)}>{t}</Badge>
            ))}
            {tags.more > 0 && <span className="projects-card-more label" title={p.tags.slice(TAG_CAP).join(", ")}>+{tags.more}</span>}
          </div>
        )}

        <KeyValueList className="projects-card-traits">
          {rows.has("git") && (
            <KeyValue label="Git" title="Not a git repository."><NoneText /></KeyValue>
          )}
          {rows.has("branch") && <GitRows project={p} now={now} />}
          {rows.has("stack") && <KeyValue label="Stack">{p.stack.map(stackLabel).join(", ")}</KeyValue>}
          <KeyValue label="Folder" title={p.folder}>
            <span className="projects-path">
              {folder.head && <span className="projects-path-head">{folder.head}</span>}
              <span className="projects-path-tail">{folder.tail}</span>
            </span>
          </KeyValue>
          {rows.has("links") && (
            <KeyValue label="Links" title="">
              <ProjectLinks project={p} onOpen={(k) => a.openLink(p.id, k)} />
            </KeyValue>
          )}
        </KeyValueList>
      </CardBody>

      <CardFooter className="projects-card-foot">
        <OpenActions project={p} editorClassName="projects-card-open" onOpen={(t) => a.open(p.id, t)} />
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
