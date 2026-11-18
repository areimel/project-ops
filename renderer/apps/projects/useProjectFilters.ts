import { useEffect, useMemo, useState } from "react";
import type { ProjectView } from "../../../shared/projects/view";
import { VIEW_STATE_KEY, healViewState, type ViewState } from "./filterState";
import { defaultFilters, facets, filterProjects, isFiltered, sortProjects, type ProjectFilters, type SortKey } from "./projectsModel";

function load(): ViewState {
  try {
    const raw = localStorage.getItem(VIEW_STATE_KEY);
    return healViewState(raw ? JSON.parse(raw) : null);
  } catch {
    return healViewState(null);
  }
}

/** Filters and sort, kept in localStorage; the result and facet counts are memoised on (projects, filters, sort). */
export function useProjectFilters(projects: readonly ProjectView[]) {
  const [state, setState] = useState<ViewState>(load);
  const { filters, sort } = state;

  useEffect(() => {
    try { localStorage.setItem(VIEW_STATE_KEY, JSON.stringify(state)); } catch { /* storage off: the view just is not remembered */ }
  }, [state]);

  const filtered = useMemo(() => filterProjects(projects, filters), [projects, filters]);
  const results = useMemo(() => sortProjects(filtered, sort), [filtered, sort]);
  const counts = useMemo(() => facets(projects, filters), [projects, filters]);

  return {
    filters,
    sort,
    results,
    facets: counts,
    filtered: isFiltered(filters),
    setFilters: (update: (f: ProjectFilters) => ProjectFilters) => setState((s) => ({ ...s, filters: update(s.filters) })),
    setSort: (next: SortKey) => setState((s) => ({ ...s, sort: next })),
    clear: () => setState((s) => ({ ...s, filters: defaultFilters() })),
  };
}
