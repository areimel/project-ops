import { useMemo } from "react";
import type { useAttempt } from "../../hooks/useAttempt";
import type { useProjects } from "../../hooks/useProjects";
import { useLatest } from "../../hooks/useLatest";
import { categoryValue, includeTag } from "./filterState";
import type { CardActions } from "./ProjectCard";
import type { ProjectFilters } from "./projectsModel";

interface Inputs {
  api: ReturnType<typeof useProjects>;
  attempt: ReturnType<typeof useAttempt>;
  /** Open the edit dialog for a project. */
  edit(id: string): void;
  /** Show the project's page. */
  show(id: string): void;
  /** Apply a filter change: the live filters on the Projects screen, or the stored ones before going there. */
  filter(update: (f: ProjectFilters) => ProjectFilters): void;
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
      edit: (id) => latest.current.edit(id),
      show: (id) => latest.current.show(id),
      refresh: (id) => void latest.current.attempt(() => latest.current.api.refresh(id), "Refreshed"),
      filterTag: (tag) => latest.current.filter((f) => includeTag(f, tag)),
      filterCategory: (c) => latest.current.filter((f) => ({ ...f, category: categoryValue(c) })),
    };
  }, [latest]);
}
