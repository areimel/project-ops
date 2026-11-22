import { memo } from "react";
import type { OpenTarget } from "../../../shared/projects/record";
import type { ProjectView } from "../../../shared/projects/view";
import { Button } from "../../components/common/Button";
import { Card, CardBody, CardFooter } from "../../components/common/Card";
import { IconButton } from "../../components/common/IconButton";
import { StatusDot } from "../../components/common/StatusDot";
import { cardMuted, cardStatus } from "../projects/cardModel";

/** What a tile can ask for, by project id, so one stable object serves every tile. */
export interface TileActions {
  open(id: string, target: OpenTarget): void;
  show(id: string): void;      // go to its card in the projects grid
}

interface Props {
  project: ProjectView;
  /** The second line's right-hand text: "Opened today", "Commit 3 days ago". */
  note: string;
  actions: TileActions;
}

/** A compact project: status, name, branch, and the three ways to open it. Editing stays in the projects grid. */
function ProjectTileImpl({ project: p, note, actions: a }: Props) {
  const status = cardStatus(p);
  const gone = p.missing;
  return (
    <Card as="li" className="dashboard-tile" muted={cardMuted(p)} aria-label={p.name}>
      <CardBody className="dashboard-tile-body">
        <div className="dashboard-tile-head">
          <button type="button" className="dashboard-tile-name" title={`Open ${p.name}`} onClick={() => a.show(p.id)}>
            {p.name}
          </button>
          <StatusDot tone={status.tone} className="dashboard-tile-status">{status.label}</StatusDot>
        </div>
        <p className="dashboard-tile-meta">
          <span className="dashboard-tile-branch" title={p.dirty ? `${p.branch ?? "No branch"}: uncommitted changes` : p.branch ?? undefined}>
            {gone ? "Folder missing" : p.branch ?? "No git"}
            {p.dirty && !gone && <span className="bullet dashboard-dirty" title="Uncommitted changes"><span className="visually-hidden">, uncommitted changes</span></span>}
          </span>
          <span className="dashboard-tile-note">{note}</span>
        </p>
      </CardBody>
      <CardFooter className="dashboard-tile-foot">
        <Button variant="quiet" icon="code" className="dashboard-tile-open" aria-label={`Open ${p.name} in editor`} title="Open in editor"
          disabled={gone} onClick={() => a.open(p.id, "editor")}>Editor</Button>
        <IconButton icon="terminal" label="Open terminal here" disabled={gone} onClick={() => a.open(p.id, "terminal")} />
        <IconButton icon="folder" label="Open folder" disabled={gone} onClick={() => a.open(p.id, "folder")} />
      </CardFooter>
    </Card>
  );
}

export const ProjectTile = memo(ProjectTileImpl);
