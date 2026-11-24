import { ProjectTile } from "../../../dashboard/ProjectTile";
import { NOOP_TILE_ACTIONS, PROJECTS } from "../../fixtures";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "dashboard-tile",
  title: "Dashboard tile",
  family: "patterns",
  source: "renderer/apps/dashboard/ProjectTile.tsx",
  exports: ["ProjectTile", "TileActions"],
  purpose: "A compact project for the dashboard: status light, name, branch with a dirty mark, a short note and the three open buttons. The name goes to the project's page in the Projects app.",
  useFor: [
    "The Pinned and Recent lists on the dashboard, where a project only needs to be reached and opened.",
    "A short row of projects that sits next to other content and must not take the room of a full card.",
    "Any place where editing is not offered: the tile has no edit, pin or copy buttons.",
  ],
  notFor: [
    "Browsing, filtering and editing many projects: use ProjectCard in the Projects grid.",
    "Showing description, tags, stack or links: the tile leaves them out; use ProjectCard.",
    "Something that is not a project: compose Card.",
  ],
  snippet: "<ul className=\"card-grid dashboard-tiles\" aria-label={label}>\n  {projects.map((p) => (\n    <ProjectTile key={p.id} project={p}\n      note={noteFor(p)} actions={actions} />\n  ))}\n</ul>\n// note: \"Opened today\", \"Commit 3 days ago\"\n// actions: { open(id, target), show(id) }",
  specimens: [
    {
      label: "Clean, uncommitted changes and missing folder", wide: true,
      render: () => (
        <ul className="card-grid dashboard-tiles" aria-label="Projects">
          <ProjectTile project={PROJECTS.pinned} note="Opened 5 hours ago" actions={NOOP_TILE_ACTIONS} />
          <ProjectTile project={PROJECTS.dirty} note="Commit 2 days ago" actions={NOOP_TILE_ACTIONS} />
          <ProjectTile project={PROJECTS.missing} note="Opened 3 days ago" actions={NOOP_TILE_ACTIONS} />
        </ul>
      ),
    },
    {
      label: "Paused and no git", wide: true,
      render: () => (
        <ul className="card-grid dashboard-tiles" aria-label="Projects">
          <ProjectTile project={PROJECTS.paused} note="Commit 80 days ago" actions={NOOP_TILE_ACTIONS} />
          <ProjectTile project={PROJECTS.noGit} note="Opened today" actions={NOOP_TILE_ACTIONS} />
        </ul>
      ),
    },
  ],
  notes: [
    "Versus the card: no category strip, description, tags or trait rows, one line of meta (branch plus dirty mark, and a note), and no edit, pin or copy buttons. Footer is OpenActions with the labelled Editor button.",
    "A missing folder shows Folder missing in place of the branch, mutes the tile and disables the open buttons. The status light is label-hidden but still announced.",
    "The note is chosen by the caller (dashboardModel.ts decides pinned versus recent wording); the tile only displays it.",
    "Needs the card-grid and dashboard-tiles classes (dashboard.css, loaded here). Tiles are li elements.",
  ],
} satisfies CatalogueEntry;
