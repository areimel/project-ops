import { useMemo } from "react";
import type { useAttempt } from "../../hooks/useAttempt";
import type { useProjects } from "../../hooks/useProjects";
import { useLatest } from "../../hooks/useLatest";
import { categoryValue, includeTag } from "./filterState";
import type { CardActions } from "./ProjectCard";
import type { useProjectFilters } from "./useProjectFilters";

interface Inputs {
  api: ReturnType<typeof useProjects>;
  view: ReturnType<typeof useProjectFilters>;
  attempt: ReturnType<typeof useAttempt>;
  setEditing(id: string | null): void;
  setProfile(id: string | null): void;
}

/** One stable CardActions object for every card and the dossier; it reads the latest inputs when called. */
export function useProjectActions(inputs: Inputs): CardActions {
  const latest = useLatest(inputs);
  return useMemo<CardActions>(() => {
    const find = (id: string) => latest.current.api.projects.find((p) => p.id === id);
    return {
      open: (id, target) => void latest.current.attempt(() => latest.current.api.open(id, target)),
      openLink: (id, key) => void latest.current.attempt(() => latest.current.api.openLink(id, key)),
      copyPath: (id) => void latest.current.attempt(() => latest.current.api.copyPath(id), "Path copied"),
      togglePin: (id) => {
        const p = find(id);
        if (p) void latest.current.attempt(() => latest.current.api.update(id, { pinned: !p.pinned }), p.pinned ? "Unpinned" : "Pinned");
      },
      edit: (id) => latest.current.setEditing(id),
      show: (id) => latest.current.setProfile(id),
      refresh: (id) => void latest.current.attempt(() => latest.current.api.refresh(id), "Refreshed"),
      filterTag: (tag) => latest.current.view.setFilters((f) => includeTag(f, tag)),
      filterCategory: (c) => latest.current.view.setFilters((f) => ({ ...f, category: categoryValue(c) })),
    };
  }, [latest]);
}
