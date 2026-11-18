import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { Spinner } from "../../components/common/Spinner";
import { useAttempt } from "../../hooks/useAttempt";
import { useLatest } from "../../hooks/useLatest";
import { useProjects, useRoots, useScanState } from "../../hooks/useProjects";
import { useCommandHandlers, useShell, useTitleInfo } from "../../shell/ShellContext";
import { projectCount, scanMessage } from "../../utils/projectText";
import { FilterRail } from "./FilterRail";
import { categoryValue, includeTag, revealFilters } from "./filterState";
import { ProjectCard, type CardActions } from "./ProjectCard";
import { ProjectDialog } from "./ProjectDialog";
import { allCategories, allTags } from "./projectsModel";
import { ProjectsToolbar } from "./ProjectsToolbar";
import { useProjectFilters } from "./useProjectFilters";
import "./projects.css";

/** The home screen: every project as a card, with a filter rail and a toolbar. */
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
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const scrolledTo = useRef<string | null>(null);
  const now = useMemo(() => Date.now(), [projects]);

  useTitleInfo({ count: status === "ready" ? projectCount(projects.length) : undefined });

  // ---- focus a project: a deep link, or a folder just added ----
  // The router makes a new route object for every navigation, so opening the same project again refocuses it.
  useEffect(() => { if (route.view === "app" && route.recordId) setPendingFocus(route.recordId); }, [route]);
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
  useEffect(() => {
    if (!selected || scrolledTo.current === selected) return;
    const el = document.querySelector(`[data-project-id="${selected}"]`);
    if (!el) return;
    scrolledTo.current = selected;
    el.scrollIntoView({ block: "center" });
  }, [selected, view.results]);

  // ---- actions ----
  const latest = useLatest({ projects, api, view, attempt });
  const actions = useMemo<CardActions>(() => {
    const find = (id: string) => latest.current.projects.find((p) => p.id === id);
    return {
      open: (id, target) => void latest.current.attempt(() => latest.current.api.open(id, target)),
      openLink: (id, key) => void latest.current.attempt(() => latest.current.api.openLink(id, key)),
      copyPath: (id) => void latest.current.attempt(() => latest.current.api.copyPath(id), "Path copied"),
      togglePin: (id) => {
        const p = find(id);
        if (p) void latest.current.attempt(() => latest.current.api.update(id, { pinned: !p.pinned }), p.pinned ? "Unpinned" : "Pinned");
      },
      edit: (id) => setEditing(id),
      filterTag: (tag) => latest.current.view.setFilters((f) => includeTag(f, tag)),
      filterCategory: (c) => latest.current.view.setFilters((f) => ({ ...f, category: categoryValue(c) })),
    };
  }, [latest]);

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
    ...(view.filtered ? { "projects.clear-filters": view.clear } : {}),
  });

  const editingProject = editing ? projects.find((p) => p.id === editing) ?? null : null;
  const categories = useMemo(() => allCategories(projects), [projects]);
  const tags = useMemo(() => allTags(projects), [projects]);

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
          action={<div className="projects-empty-actions">
            <Button variant="primary" icon="plus" onClick={addRoot}>Add a scan folder</Button>
            <Button variant="quiet" onClick={addFolder}>Add one folder</Button>
          </div>} />
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
        <div className="projects-scroll">
          {view.results.length === 0 ? (
            <EmptyState icon="filter" title="No projects match" body="Nothing fits the search and filters you have set."
              action={<Button variant="quiet" icon="close" onClick={view.clear}>Clear filters</Button>} />
          ) : (
            <ul className="projects-grid" aria-label="Projects">
              {view.results.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} selected={p.id === selected} now={now} actions={actions} />
              ))}
            </ul>
          )}
        </div>
      </div>
      {editingProject && (
        <ProjectDialog key={editingProject.id} project={editingProject} categories={categories} tags={tags}
          onClose={() => setEditing(null)} onRemove={() => remove(editingProject.id)}
          onSave={(patch) => attempt(() => api.update(editingProject.id, patch), "Saved")} />
      )}
    </div>
  );
}
