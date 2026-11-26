// Small pieces the project card, the dashboard tile and the dossier all show: open buttons, links, git rows,
// the uncommitted-changes mark and the muted "None". The styles come with the module, so the dashboard
// gets them without loading projects.css.
import type { OpenTarget, ProjectLinkKey } from "../../../shared/projects/record";
import type { ProjectView } from "../../../shared/projects/view";
import { Button } from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { IconButton } from "../../components/common/IconButton";
import { KeyValue } from "../../components/common/KeyValue";
import { LINK_LABELS, branchTitle, gitInfo, lastCommitTitle, linkKeys } from "./cardModel";
import { relativeTime } from "./projectsModel";
import "./projectParts.css";

interface OpenActionsProps {
  project: Pick<ProjectView, "name" | "missing">;
  onOpen(target: OpenTarget): void;
  /** "editor": a labelled Editor button, then terminal and folder as icons. "all": three labelled buttons. */
  labels?: "editor" | "all";
  /** For the Editor button only (spacing differs between the card and the tile). */
  editorClassName?: string;
}

/** Open in the editor, the terminal and the folder, always in that order. A missing folder disables all three. */
export function OpenActions({ project: p, onOpen, labels = "editor", editorClassName }: OpenActionsProps) {
  const gone = p.missing;
  if (labels === "all") {
    return (
      <>
        <Button variant="quiet" icon="code" disabled={gone} onClick={() => onOpen("editor")}>Editor</Button>
        <Button variant="quiet" icon="terminal" disabled={gone} onClick={() => onOpen("terminal")}>Terminal</Button>
        <Button variant="quiet" icon="folder" disabled={gone} onClick={() => onOpen("folder")}>Folder</Button>
      </>
    );
  }
  return (
    <>
      {/* The accessible name starts with the visible text ("Editor"), so voice control can say what it sees. */}
      <Button variant="quiet" icon="code" className={editorClassName} aria-label={`Editor: open ${p.name}`} title="Open in editor"
        disabled={gone} onClick={() => onOpen("editor")}>Editor</Button>
      <IconButton icon="terminal" label="Open terminal here" disabled={gone} onClick={() => onOpen("terminal")} />
      <IconButton icon="folder" label="Open folder" disabled={gone} onClick={() => onOpen("folder")} />
    </>
  );
}

/** The repo, site and docs links the project has, as buttons. The caller supplies the wrapper that spaces them. */
export function ProjectLinks({ project: p, onOpen }: { project: Pick<ProjectView, "links">; onOpen(key: ProjectLinkKey): void }) {
  return (
    <>
      {linkKeys(p).map((k) => (
        <button key={k} type="button" className="projects-link" title={p.links[k] ?? undefined} onClick={() => onOpen(k)}>
          {LINK_LABELS[k]}<Icon name="arrowUpRight" size={12} />
        </button>
      ))}
    </>
  );
}

/** The mark after a branch name when the work tree has uncommitted changes. */
export function DirtyMark() {
  return <span className="bullet projects-dirty" title="Uncommitted changes"><span className="visually-hidden">, uncommitted changes</span></span>;
}

/** The muted fallback for a value that is not there ("None") or could not be read ("Unknown"). */
export function NoneText({ children = "None" }: { children?: string }) {
  return <span className="text-muted">{children}</span>;
}

/** The Branch and Last commit rows. Render only when the folder is a repository (`gitInfo(p) !== "none"`). */
export function GitRows({ project: p, now }: { project: Pick<ProjectView, "branch" | "dirty" | "lastCommitAt">; now: number }) {
  const read = gitInfo(p) === "read";
  return (
    <>
      <KeyValue label="Branch" title={branchTitle(p)}>
        {p.branch ?? <NoneText />}
        {p.dirty && <DirtyMark />}
      </KeyValue>
      <KeyValue label="Last commit" title={lastCommitTitle(p)}>
        {read ? relativeTime(p.lastCommitAt, now) : <NoneText>Unknown</NoneText>}
      </KeyValue>
    </>
  );
}
