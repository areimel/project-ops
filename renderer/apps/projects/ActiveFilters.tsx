import { useMemo } from "react";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { activeFilters } from "./filterState";
import type { ProjectFilters } from "./projectsModel";

interface Props {
  filters: ProjectFilters;
  onChange(update: (f: ProjectFilters) => ProjectFilters): void;
  onClear(): void;
}

/** The filters in force, as removable chips under the toolbar, so a hidden project has a visible reason. */
export function ActiveFilters({ filters, onChange, onClear }: Props) {
  const chips = useMemo(() => activeFilters(filters), [filters]);
  if (chips.length === 0) return null;
  return (
    <div className="projects-active" role="group" aria-label="Active filters">
      {chips.map((c) => (
        <Badge key={c.key} variant="tag" onRemove={() => onChange(c.remove)}>{c.label}</Badge>
      ))}
      {chips.length > 1 && <Button variant="link" className="projects-active-clear" onClick={onClear}>Clear all</Button>}
    </div>
  );
}
