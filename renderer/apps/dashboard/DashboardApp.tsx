import { useMemo, useState } from "react";
import { RESOURCE_LIMITS } from "../../../shared/resources/links";
import type { ProjectView } from "../../../shared/projects/view";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { SectionHead } from "../../components/common/SectionHead";
import { Spinner } from "../../components/common/Spinner";
import { useAttempt } from "../../hooks/useAttempt";
import { useProjects } from "../../hooks/useProjects";
import { useResourceLinks } from "../../hooks/useResourceLinks";
import { useCommandHandlers, useShell, useTitleInfo } from "../../shell/ShellContext";
import { ProjectCard } from "../projects/ProjectCard";
import { useProjectActions } from "../projects/useProjectActions";
import { useProjectEditor } from "../projects/useProjectEditor";
import { updateStoredFilters } from "../projects/viewStore";
import { knownGroups, pinnedTiles, recentTiles } from "./dashboardModel";
import { LinkDialog } from "./LinkDialog";
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

  const editor = useProjectEditor({ api, attempt });
  // The card is the Projects grid's own: its page and its tag and category filters live on the Projects screen.
  const actions = useProjectActions({
    api, attempt, edit: editor.edit,
    show: (id) => navigate({ type: "open", appId: PROJECTS_APP, recordId: id }),
    filter: (update) => { updateStoredFilters(update); navigate({ type: "open", appId: PROJECTS_APP }); },
  });
  const allProjects = () => navigate({ type: "open", appId: PROJECTS_APP });

  const full = res.links.length >= RESOURCE_LIMITS.max;
  useCommandHandlers(full ? {} : { "dashboard.add-link": () => setDialog("new") });

  const editing = dialog && dialog !== "new" ? res.links.find((l) => l.id === dialog) ?? null : null;
  const removeLink = async (id: string, name: string) => {
    if (!(await confirm({ title: `Remove ${name}?`, body: "The link is taken off the dashboard.", confirmLabel: "Remove", danger: true }))) return;
    setDialog(null);
    void attempt(() => res.remove(id), "Link removed");
  };

  const cards = (list: readonly ProjectView[], label: string) => (
    <ul className="card-grid projects-grid" aria-label={label}>
      {list.map((p) => <ProjectCard key={p.id} project={p} selected={false} now={now} actions={actions} />)}
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
            <SectionHead title="Pinned" end={<Button variant="link" onClick={allProjects}>All projects</Button>} />
            {pinned.length > 0
              ? cards(pinned, "Pinned projects")
              : <p className="hint dashboard-hint">Nothing is pinned. Pin a project on the Projects screen to keep it here.</p>}
          </section>
          <section className="dashboard-section" aria-label="Recent">
            <SectionHead title="Recent" />
            {recent.length > 0
              ? cards(recent, "Recently opened projects")
              : <p className="hint dashboard-hint">Projects you open in an editor, a terminal or the file manager are listed here, newest first.</p>}
          </section>
        </>)}

        {res.status === "error" ? (
          <section className="dashboard-section" aria-label="Resources">
            <SectionHead title="Resources" />
            <p className="hint dashboard-hint">Your links could not be loaded: {res.error} <Button variant="link" onClick={() => void res.reload()}>Try again</Button></p>
          </section>
        ) : (
          <ResourceLinks links={res.links} full={full} onAdd={() => setDialog("new")} onEdit={setDialog}
            onOpen={(id) => void attempt(() => res.open(id))} />
        )}
      </div>

      {editor.dialog}
      {(dialog === "new" || editing) && (
        <LinkDialog key={dialog} link={editing} groups={groups} onClose={() => setDialog(null)}
          onRemove={() => { if (editing) void removeLink(editing.id, editing.name); }}
          onSave={(patch) => attempt(() => (editing ? res.update(editing.id, patch) : res.create(patch)), editing ? "Saved" : "Link added")} />
      )}
    </div>
  );
}
