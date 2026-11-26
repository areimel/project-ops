// The Projects screen's filters and sort as kept in localStorage, so another screen can set a filter before it
// navigates there. Every read is healed; storage that is off or full just means the view is not remembered.
import { VIEW_STATE_KEY, healViewState, type ViewState } from "./filterState";
import type { ProjectFilters } from "./projectsModel";

export function loadViewState(): ViewState {
  try {
    const raw = localStorage.getItem(VIEW_STATE_KEY);
    return healViewState(raw ? JSON.parse(raw) : null);
  } catch {
    return healViewState(null);
  }
}

export function saveViewState(state: ViewState): void {
  try { localStorage.setItem(VIEW_STATE_KEY, JSON.stringify(state)); } catch { /* storage off: the view just is not remembered */ }
}

/** Change the stored filters; the Projects screen reads them when it next mounts. */
export function updateStoredFilters(update: (f: ProjectFilters) => ProjectFilters): void {
  const state = loadViewState();
  saveViewState({ ...state, filters: update(state.filters) });
}
