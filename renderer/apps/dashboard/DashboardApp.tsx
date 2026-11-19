import { useMemo, useState } from "react";
import { RESOURCE_LIMITS } from "../../../shared/resources/links";
import type { ProjectView } from "../../../shared/projects/view";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { Spinner } from "../../components/common/Spinner";
import { useAttempt } from "../../hooks/useAttempt";
import { useLatest } from "../../hooks/useLatest";
import { useProjects } from "../../hooks/useProjects";
import { useResourceLinks } from "../../hooks/useResourceLinks";
import { useCommandHandlers, useShell, useTitleInfo } from "../../shell/ShellContext";
import { relativeTime } from "../projects/projectsModel";
import { knownGroups, pinnedTiles, recentTiles } from "./dashboardModel";
import { LinkDialog } from "./LinkDialog";
import { ProjectTile, type TileActions } from "./ProjectTile";
import { ResourceLinks } from "./ResourceLinks";
import "./dashboard.css";

const PROJECTS_APP = "projects";

/** The home screen: a launchpad of pinned and recently opened projects, and the owner's resource links. */
export default function DashboardApp() {
  const api = useProjects();
  const res = useResourceLinks();
  const { navigate, confirm } = useShell();
  const attempt = useAttempt();
  /** The link dialog: null = closed, "new", or the id of the link being edited. */
  const [dialog, setDialog] = useState<string | null>(null);
  const { projects, status } = api;
  const now = useMemo(() => Date.now(), [projects]);
  const pinned = useMemo(() => pinnedTiles(projects), [projects]);
  const recent = useMemo(() => recentTiles(projects), [projects]);
  const groups = useMemo(() => knownGroups(res.links), [res.links]);

  useTitleInfo({ count: status === "ready" && pinned.length > 0 ? `${pinned.length} pinned` : undefined });

  const latest = useLatest({ api, attempt, navigate });
  const actions = useMemo<TileActions>(() => ({
    open: (id, target) => void latest.current.attempt(() => latest.current.api.open(id, target)),
    show: (id) => latest.current.navigate({ type: "open", appId: PROJECTS_APP, recordId: id }),
  }), [latest]);
  const allProjects = () => navigate({ type: "open", appId: PROJECTS_APP });

  const full = res.links.length >= RESOURCE_LIMITS.max;
  useCommandHandlers(full ? {} : { "dashboard.add-link": () => setDialog("new") });

  const editing = dialog && dialog !== "new" ? res.links.find((l) => l.id === dialog) ?? null : null;
  const removeLink = async (id: string, name: string) => {
    if (!(await confirm({ title: `Remove ${name}?`, body: "The link is taken off the dashboard.", confirmLabel: "Remove", danger: true }))) return;
    setDialog(null);
    void attempt(() => res.remove(id), "Link removed");
  };

  const tiles = (list: readonly ProjectView[], label: string, note: (p: ProjectView) => string) => (
    <ul className="dashboard-tiles" aria-label={label}>
      {list.map((p) => <ProjectTile key={p.id} project={p} note={note(p)} actions={actions} />)}
    </ul>
  );

  if (status === "loading") {
    return <div className="app-root dashboard dashboard-center"><Spinner label="Loading the dashboard" /></div>;
  }

  return (
    <div className="app-root dashboard">
      <div className="dashboard-page">
        {status === "error" ? (
          <EmptyState icon="warning" title="Projects could not be loaded" body={api.error ?? undefined}
            action={<Button variant="quiet" icon="refresh" onClick={() => void api.reload()}>Try again</Button>} />
        ) : projects.length === 0 ? (
          <EmptyState icon="folder" title="No projects yet"
            body="Add a folder of projects on the Projects screen. The ones you pin and the ones you open will show up here."
            action={<Button variant="primary" onClick={allProjects}>Go to Projects</Button>} />
        ) : (<>
          <section className="dashboard-section" aria-label="Pinned">
            <div className="dashboard-section-head">
              <h2 className="kicker">Pinned</h2>
              <Button variant="link" onClick={allProjects}>All projects</Button>
            </div>
            {pinned.length > 0
              ? tiles(pinned, "Pinned projects", (p) => (p.lastCommitAt === null ? "" : `Commit ${relativeTime(p.lastCommitAt, now)}`))
              : <p className="dashboard-hint">Nothing is pinned. Pin a project on the Projects screen to keep it here.</p>}
          </section>
          <section className="dashboard-section" aria-label="Recent">
            <div className="dashboard-section-head"><h2 className="kicker">Recent</h2></div>
            {recent.length > 0
              ? tiles(recent, "Recently opened projects", (p) => `Opened ${relativeTime(p.lastOpenedAt, now)}`)
              : <p className="dashboard-hint">Projects you open in an editor, a terminal or the file manager are listed here, newest first.</p>}
          </section>
        </>)}

        {res.status === "error" ? (
          <section className="dashboard-section" aria-label="Resources">
            <div className="dashboard-section-head"><h2 className="kicker">Resources</h2></div>
            <p className="dashboard-hint">Your links could not be loaded: {res.error} <Button variant="link" onClick={() => void res.reload()}>Try again</Button></p>
          </section>
        ) : (
          <ResourceLinks links={res.links} full={full} onAdd={() => setDialog("new")} onEdit={setDialog}
            onOpen={(id) => void attempt(() => res.open(id))} />
        )}
      </div>

      {(dialog === "new" || editing) && (
        <LinkDialog key={dialog} link={editing} groups={groups} onClose={() => setDialog(null)}
          onRemove={() => { if (editing) void removeLink(editing.id, editing.name); }}
          onSave={(patch) => attempt(() => (editing ? res.update(editing.id, patch) : res.create(patch)), editing ? "Saved" : "Link added")} />
      )}
    </div>
  );
}
