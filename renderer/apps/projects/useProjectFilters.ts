import { useEffect, useMemo, useState } from "react";
import type { ProjectView } from "../../../shared/projects/view";
import type { ViewState } from "./filterState";
import { loadViewState, saveViewState } from "./viewStore";
import { defaultFilters, facets, filterProjects, isFiltered, sortProjects, type ProjectFilters, type SortKey } from "./projectsModel";

/** Filters and sort, kept in localStorage; the result and facet counts are memoised on (projects, filters, sort). */
export function useProjectFilters(projects: readonly ProjectView[]) {
  const [state, setState] = useState<ViewState>(loadViewState);
  const { filters, sort } = state;

  useEffect(() => saveViewState(state), [state]);

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
