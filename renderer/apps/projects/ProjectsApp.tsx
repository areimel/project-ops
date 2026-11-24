import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { SectionHead } from "../../components/common/SectionHead";
import { Spinner } from "../../components/common/Spinner";
import { useAttempt } from "../../hooks/useAttempt";
import { useLatest } from "../../hooks/useLatest";
import { useProjects, useRoots, useScanState } from "../../hooks/useProjects";
import { useCommandHandlers, useShell, useTitleInfo } from "../../shell/ShellContext";
import { projectCount, scanMessage } from "../../utils/projectText";
import { ActiveFilters } from "./ActiveFilters";
import { FilterRail } from "./FilterRail";
import { revealFilters } from "./filterState";
import { ProjectCard } from "./ProjectCard";
import { ProjectDossier } from "./dossier/ProjectDossier";
import { useProjectActions } from "./useProjectActions";
import { ProjectDialog } from "./ProjectDialog";
import { allCategories, allHosting, allServices, allTags, pinnedSplit } from "./projectsModel";
import type { ProjectView } from "../../../shared/projects/view";
import { ProjectsToolbar } from "./ProjectsToolbar";
import { useProjectFilters } from "./useProjectFilters";
import "./projects.css";

/** Every project as a card, with a filter rail and a toolbar. */
export default function ProjectsApp() {
  const api = useProjects();
  const { projects, status } = api;
  const roots = useRoots();
  const scanning = useScanState();
  const { toast, route } = useShell();
  const attempt = useAttempt();
  const view = useProjectFilters(projects);
  const searchRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [profile, setProfile] = useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const scrolledTo = useRef<string | null>(null);
  const now = useMemo(() => Date.now(), [projects]);

  useTitleInfo({ count: status === "ready" ? projectCount(projects.length) : undefined });

  // ---- a deep link opens the project page; a folder just added is focused in the grid ----
  // The router makes a new route object for every navigation, so opening the same project again reopens it.
  useEffect(() => { if (route.view === "app") setProfile(route.recordId ?? null); }, [route]);
  const back = () => { const id = profile; setProfile(null); if (id) setPendingFocus(id); };
  const latestFilters = useLatest(view.filters);
  useEffect(() => {
    if (!pendingFocus || status !== "ready") return;
    const reveal = revealFilters(projects, latestFilters.current, pendingFocus);
    if (!reveal) return; // not there (yet); an unknown id just leaves the grid as it is
    if (reveal !== latestFilters.current) view.setFilters(() => reveal);
    scrolledTo.current = null;
    setSelected(pendingFocus);
    setPendingFocus(null);
  }, [pendingFocus, projects, status]);
  // The grid is unmounted while a dossier shows, so coming back always scrolls (and focuses) the card again.
  useEffect(() => {
    if (profile) { scrolledTo.current = null; return; }
    if (!selected || scrolledTo.current === selected) return;
    const el = document.querySelector(`[data-project-id="${selected}"]`);
    if (!el) return;
    scrolledTo.current = selected;
    el.scrollIntoView({ block: "center" });
    el.querySelector<HTMLElement>(".projects-card-name-text")?.focus({ preventScroll: true });
  }, [selected, view.results, profile]);

  // ---- actions ----
  const actions = useProjectActions({ api, view, attempt, setEditing, setProfile });

  const addFolder = () => void attempt(api.addFolder, (r) => {
    if (r) setPendingFocus(r.id);
    return r ? "Project added" : null;
  });
  const addRoot = () => void attempt(roots.add, (r) => (r ? `Added ${r.folder}` : null));
  const rescan = () => { if (!scanning) void attempt(api.scan, scanMessage); };
  const remove = (id: string) => {
    const p = projects.find((x) => x.id === id);
    setEditing(null);
    void attempt(() => api.remove(id)).then((ok) => {
      if (ok) toast("info", `Removed ${p?.name ?? "project"}`, { label: "Undo", run: () => void attempt(() => api.restore(id), "Restored") });
    });
  };

  useCommandHandlers({
    "projects.search": () => { searchRef.current?.focus(); searchRef.current?.select(); },
    "projects.add-folder": addFolder,
    "projects.rescan": rescan,
    ...(profile ? { "projects.back": back } : {}),
    ...(view.filtered ? { "projects.clear-filters": view.clear } : {}),
  });

  const editingProject = editing ? projects.find((p) => p.id === editing) ?? null : null;
  const categories = useMemo(() => allCategories(projects), [projects]);
  const tags = useMemo(() => allTags(projects), [projects]);
  const hosting = useMemo(() => allHosting(projects), [projects]);
  const services = useMemo(() => allServices(projects), [projects]);
  const dialog = editingProject && (
    <ProjectDialog key={editingProject.id} project={editingProject} categories={categories} tags={tags} hosting={hosting} services={services}
      onClose={() => setEditing(null)} onRemove={() => remove(editingProject.id)}
      onSave={(patch) => attempt(() => api.update(editingProject.id, patch), "Saved")} />
  );
  const split = pinnedSplit(view.results);
  const grid = (list: readonly ProjectView[], label: string) => (
    <ul className="card-grid projects-grid" aria-label={label}>
      {list.map((p) => <ProjectCard key={p.id} project={p} selected={p.id === selected} now={now} actions={actions} />)}
    </ul>
  );

  if (status === "loading") {
    return <div className="app-root projects projects-center"><Spinner label="Loading projects" /></div>;
  }
  if (status === "error") {
    return (
      <div className="app-root projects projects-center">
        <EmptyState icon="warning" title="Projects could not be loaded" body={api.error ?? undefined}
          action={<Button variant="quiet" icon="refresh" onClick={() => void api.reload()}>Try again</Button>} />
      </div>
    );
  }
  if (projects.length === 0) {
    return (
      <div className="app-root projects projects-center">
        <EmptyState icon="folder" title="No projects yet"
          body="Add a folder that holds your projects and each one inside it is listed here. Or add a single project folder."
          action={<div className="btn-row projects-empty-actions">
            <Button variant="primary" icon="plus" onClick={addRoot}>Add a scan folder</Button>
            <Button variant="quiet" onClick={addFolder}>Add one folder</Button>
          </div>} />
      </div>
    );
  }

  if (profile) {
    return (
      <div className="app-root projects projects-dossier-root">
        <ProjectDossier project={projects.find((p) => p.id === profile) ?? null} now={now} actions={actions} onBack={back} />
        {dialog}
      </div>
    );
  }

  return (
    <div className="app-root projects">
      <FilterRail facets={view.facets} filters={view.filters} filtered={view.filtered} onChange={view.setFilters} onClear={view.clear} />
      <div className="projects-main">
        <ProjectsToolbar query={view.filters.query} onQuery={(q) => view.setFilters((f) => ({ ...f, query: q }))} searchRef={searchRef}
          sort={view.sort} onSort={view.setSort} shown={view.results.length} total={projects.length}
          scanning={scanning} onAddFolder={addFolder} onRescan={rescan} />
        <ActiveFilters filters={view.filters} onChange={view.setFilters} onClear={view.clear} />
        <div className="scroll-area projects-scroll">
          {view.results.length === 0 ? (
            <EmptyState icon="filter" title="No projects match" body="Nothing fits the search and filters you have set."
              action={<Button variant="quiet" icon="close" onClick={view.clear}>Clear filters</Button>} />
          ) : split > 0 ? (<>
            <SectionHead title="Pinned" className="projects-group" />
            {grid(view.results.slice(0, split), "Pinned projects")}
            <SectionHead title="Other projects" className="projects-group" />
            {grid(view.results.slice(split), "Other projects")}
          </>) : grid(view.results, "Projects")}
        </div>
      </div>
      {dialog}
    </div>
  );
}
