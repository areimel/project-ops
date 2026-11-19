import type { Ref } from "react";
import { Button } from "../../components/common/Button";
import { Dropdown } from "../../components/common/Dropdown";
import { Spinner } from "../../components/common/Spinner";
import { TextField } from "../../components/common/TextField";
import { useHint } from "../../shell/ShellContext";
import { SORT_OPTIONS, type SortKey } from "./projectsModel";

interface Props {
  query: string;
  onQuery(q: string): void;
  searchRef: Ref<HTMLInputElement>;
  sort: SortKey;
  onSort(s: SortKey): void;
  shown: number;
  total: number;
  scanning: boolean;
  onAddFolder(): void;
  onRescan(): void;
}

/** Search, sort, the result count, and the two ways to find more projects. */
export function ProjectsToolbar(p: Props) {
  const hint = useHint();
  const sortLabel = SORT_OPTIONS.find((o) => o.value === p.sort)?.label ?? "";
  return (
    <div className="projects-toolbar" role="toolbar" aria-label="Projects">
      <TextField className="projects-search" type="search" label="Search projects" hideLabel placeholder="Search projects"
        title={hint("projects.search")} value={p.query} onChange={p.onQuery} ref={p.searchRef}
        onKeyDown={(e) => { if (e.key === "Escape" && p.query) { e.stopPropagation(); p.onQuery(""); } }} />
      <Dropdown className="projects-sort" label="Sort projects" buttonText={`Sort: ${sortLabel}`}
        options={SORT_OPTIONS} selected={p.sort} onSelect={p.onSort} />
      <span className="label projects-count" aria-live="polite" title={`${p.shown} of ${p.total} projects shown`}>
        {p.shown} / {p.total}
      </span>
      <div className="projects-toolbar-end">
        <Button variant="quiet" icon="plus" title={hint("projects.add-folder")} onClick={p.onAddFolder}>Add folder</Button>
        <Button variant="quiet" icon={p.scanning ? undefined : "refresh"} title={hint("projects.rescan")} disabled={p.scanning} aria-busy={p.scanning} onClick={p.onRescan}>
          {p.scanning ? <Spinner label="Scanning" /> : null}
          {p.scanning ? "Scanning" : "Rescan"}
        </Button>
      </div>
    </div>
  );
}
