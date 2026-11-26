import { useMemo, useState, type ReactNode } from "react";
import type { useAttempt } from "../../hooks/useAttempt";
import type { useProjects } from "../../hooks/useProjects";
import { useShell } from "../../shell/ShellContext";
import { ProjectDialog } from "./ProjectDialog";
import { allCategories, allHosting, allServices, allTags } from "./projectsModel";

interface Inputs {
  api: ReturnType<typeof useProjects>;
  attempt: ReturnType<typeof useAttempt>;
}

/**
 * The project edit dialog for any screen that shows project cards: which project is being edited, the
 * suggestions the form offers, and remove with an Undo toast. Render `dialog` once in the screen.
 */
export function useProjectEditor({ api, attempt }: Inputs): { edit(id: string | null): void; dialog: ReactNode } {
  const { toast } = useShell();
  const [editing, setEditing] = useState<string | null>(null);
  const { projects } = api;
  const categories = useMemo(() => allCategories(projects), [projects]);
  const tags = useMemo(() => allTags(projects), [projects]);
  const hosting = useMemo(() => allHosting(projects), [projects]);
  const services = useMemo(() => allServices(projects), [projects]);

  const remove = (id: string) => {
    const p = projects.find((x) => x.id === id);
    setEditing(null);
    void attempt(() => api.remove(id)).then((ok) => {
      if (ok) toast("info", `Removed ${p?.name ?? "project"}`, { label: "Undo", run: () => void attempt(() => api.restore(id), "Restored") });
    });
  };

  const project = editing ? projects.find((p) => p.id === editing) ?? null : null;
  const dialog = project && (
    <ProjectDialog key={project.id} project={project} categories={categories} tags={tags} hosting={hosting} services={services}
      onClose={() => setEditing(null)} onRemove={() => remove(project.id)}
      onSave={(patch) => attempt(() => api.update(project.id, patch), "Saved")} />
  );
  return { edit: setEditing, dialog };
}
