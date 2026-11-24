import { memo } from "react";
import type { OpenTarget } from "../../../shared/projects/record";
import type { ProjectView } from "../../../shared/projects/view";
import { Card, CardBody, CardFooter } from "../../components/common/Card";
import { StatusDot } from "../../components/common/StatusDot";
import { branchTitle, cardMuted, cardStatus } from "../projects/cardModel";
import { DirtyMark, OpenActions } from "../projects/ProjectParts";

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
          <StatusDot tone={status.tone} hideLabel className="dashboard-tile-status">{status.label}</StatusDot>
        </div>
        <p className="dashboard-tile-meta">
          <span className="dashboard-tile-branch" title={branchTitle(p)}>
            {gone ? "Folder missing" : p.branch ?? "No git"}
            {p.dirty && !gone && <DirtyMark />}
          </span>
          <span className="dashboard-tile-note">{note}</span>
        </p>
      </CardBody>
      <CardFooter className="dashboard-tile-foot">
        <OpenActions project={p} editorClassName="dashboard-tile-open" onOpen={(t) => a.open(p.id, t)} />
      </CardFooter>
    </Card>
  );
}

export const ProjectTile = memo(ProjectTileImpl);
