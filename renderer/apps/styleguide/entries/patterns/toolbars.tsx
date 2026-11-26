import { useRef, useState } from "react";
import { Button } from "../../../../components/common/Button";
import { IconButton } from "../../../../components/common/IconButton";
import { Toolbar } from "../../../../components/common/Toolbar";
import { ProjectsToolbar } from "../../../projects/ProjectsToolbar";
import type { SortKey } from "../../../projects/projectsModel";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

const noop = () => {};

/** A hook lives here, not in a render function. */
function Bar({ scanning }: { scanning: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  return (
    <ProjectsToolbar query={query} onQuery={setQuery} searchRef={ref} sort={sort} onSort={setSort}
      shown={query ? 3 : 12} total={12} scanning={scanning} onAddFolder={noop} onRescan={noop} />
  );
}

function dossierBar(pinned: boolean, set: (v: boolean) => void) {
  return (
    <Toolbar label="Project" inset="page" className="projects-dossier-bar">
      <Button variant="quiet" onClick={noop}>All projects</Button>
      <span className="btn-row">
        <Button variant="quiet" icon="refresh" onClick={noop}>Refresh</Button>
        <IconButton icon="pin" label={pinned ? "Unpin" : "Pin to the top"} aria-pressed={pinned} onClick={() => set(!pinned)} />
        <Button variant="quiet" icon="pencil" onClick={noop}>Edit</Button>
      </span>
    </Toolbar>
  );
}

export const entry = {
  id: "toolbars",
  title: "Page toolbars",
  family: "patterns",
  source: "renderer/apps/projects/ProjectsToolbar.tsx",
  exports: ["ProjectsToolbar", "Toolbar", "Button", "IconButton"],
  purpose: "The one bar across the top of a screen: Toolbar with inset page, holding the screen's search and sort on the left and its commands on the right. The projects grid and the project page each have one.",
  useFor: [
    "A new screen's top bar: search first, then sort and counts, then the commands, with the primary command last.",
    "The project page's bar: a back button at the start and Refresh, pin and Edit at the end.",
    "A busy command: disable it, set aria-busy and show a Spinner in place of its icon.",
  ],
  notFor: [
    "A bar inside a panel or a list: Toolbar without inset.",
    "Filters: they live in the rail and as removable chips under the bar.",
    "A second bar on the same screen: one page bar per screen.",
  ],
  snippet: "<Toolbar label=\"Projects\" inset=\"page\" className=\"projects-toolbar\">\n  <TextField className=\"projects-search\" type=\"search\" label=\"Search projects\" hideLabel ... />\n  <Dropdown className=\"projects-sort\" label=\"Sort projects\" ... />\n  <span className=\"label projects-count\">{shown} / {total}</span>\n  <div className=\"projects-toolbar-end\">\n    <Button variant=\"quiet\" icon=\"plus\">Add folder</Button>\n    <Button variant=\"quiet\" icon=\"refresh\">Rescan</Button>\n  </div>\n</Toolbar>",
  specimens: [
    { label: "Projects toolbar, idle", wide: true, render: () => <Bar scanning={false} /> },
    { label: "Projects toolbar, scanning", wide: true, render: () => <Bar scanning /> },
    {
      label: "Project page bar", wide: true,
      render: () => <Live initial={false}>{(pinned, set) => dossierBar(pinned, set)}</Live>,
    },
  ],
  notes: [
    "ProjectsToolbar is the real component; it reads useHint from the shell for the key hints in the tooltips, which works here. Type in the search or change the sort to see it respond.",
    "The page bar is rebuilt from the same components as ProjectDossier, because rendering the dossier would move focus. .projects-dossier-bar only adds space-between, so the back button sits at the start and the .btn-row group at the end.",
    "Classes (projects-toolbar, projects-search, projects-sort, projects-toolbar-end) need no ancestor, so the specimens use no .projects wrapper.",
  ],
} satisfies CatalogueEntry;
