import { KeyValue, KeyValueList } from "../../../../components/common/KeyValue";
import { DirtyMark, GitRows, NoneText, OpenActions, ProjectLinks } from "../../../projects/ProjectParts";
import { FIXTURE_NOW, PROJECTS, fixtureProject } from "../../fixtures";
import type { CatalogueEntry } from "../../types";

const noop = () => {};
const unread = fixtureProject({ name: "No commit time", branch: "main", lastCommitAt: null, dirty: null });

export const entry = {
  id: "trait-rows",
  title: "Project parts",
  family: "patterns",
  source: "renderer/apps/projects/ProjectParts.tsx",
  exports: ["GitRows", "NoneText", "DirtyMark", "ProjectLinks", "OpenActions"],
  purpose: "The small pieces the project card, the dashboard tile and the project page share: git rows, the muted None, the uncommitted-changes mark, link buttons and the open buttons. Reuse them so a project looks the same everywhere.",
  useFor: [
    "Branch and Last commit rows inside a KeyValueList (GitRows), on the card and in the dossier's Git cell.",
    "Open in editor, terminal and folder with the missing-folder rule built in (OpenActions).",
    "Repo, Site and Docs link buttons for the links a project has (ProjectLinks).",
    "A value that is absent or unreadable (NoneText) and a branch with changes (DirtyMark).",
  ],
  notFor: [
    "Facts that are not about a project's git state: use KeyValue directly.",
    "Resource links on the dashboard: use ResourceLinks.",
    "Deciding which rows to show: that is traitRows in cardModel.ts, not these components.",
  ],
  snippet: "<KeyValueList>\n  {gitInfo(p) !== \"none\" && <GitRows project={p} now={now} />}\n  <KeyValue label=\"Links\">\n    <ProjectLinks project={p} onOpen={(k) => openLink(p.id, k)} />\n  </KeyValue>\n</KeyValueList>\n<OpenActions project={p} labels=\"all\"\n  onOpen={(t) => open(p.id, t)} />\n<NoneText>Unknown</NoneText>",
  specimens: [
    {
      label: "GitRows, clean", width: 320,
      render: () => <KeyValueList><GitRows project={PROJECTS.pinned} now={FIXTURE_NOW} /></KeyValueList>,
    },
    {
      label: "GitRows, uncommitted changes", width: 320,
      render: () => <KeyValueList><GitRows project={PROJECTS.dirty} now={FIXTURE_NOW} /></KeyValueList>,
    },
    {
      label: "GitRows, no last commit", width: 320,
      render: () => <KeyValueList><GitRows project={unread} now={FIXTURE_NOW} /></KeyValueList>,
    },
    {
      label: "NoneText and DirtyMark", width: 320,
      render: () => (
        <KeyValueList>
          <KeyValue label="Git"><NoneText /></KeyValue>
          <KeyValue label="Last commit"><NoneText>Unknown</NoneText></KeyValue>
          <KeyValue label="Branch">main<DirtyMark /></KeyValue>
        </KeyValueList>
      ),
    },
    {
      label: "ProjectLinks", width: 320,
      render: () => (
        <KeyValueList>
          <KeyValue label="Links" title=""><ProjectLinks project={PROJECTS.pinned} onOpen={noop} /></KeyValue>
        </KeyValueList>
      ),
    },
    {
      label: "OpenActions, labels editor (card and tile)", wide: true,
      render: () => <div className="styleguide-row"><OpenActions project={PROJECTS.pinned} onOpen={noop} /></div>,
    },
    {
      label: "OpenActions, labels all (project page)", wide: true,
      render: () => <div className="styleguide-row"><OpenActions project={PROJECTS.pinned} labels="all" onOpen={noop} /></div>,
    },
    {
      label: "OpenActions, missing folder", wide: true,
      render: () => (
        <div className="styleguide-stack">
          <div className="styleguide-row"><OpenActions project={PROJECTS.missing} onOpen={noop} /></div>
          <div className="styleguide-row"><OpenActions project={PROJECTS.missing} labels="all" onOpen={noop} /></div>
        </div>
      ),
    },
  ],
  notes: [
    "gitInfo(p) in cardModel.ts gives none (no branch: show one Git: None row), unread (a branch but no commit time, such as a repository with custom git config: GitRows shows Unknown) or read.",
    "traitRows(p) lists the rows a card shows; the card, the tile (branch only) and dossier/DossierCells.tsx each pick their own from these parts.",
    "LINK_LABELS and linkKeys in cardModel.ts name and filter the links; ProjectLinks renders nothing for a project with none, and the caller supplies the wrapper that spaces them.",
    "OpenActions labels=\"editor\" gives a labelled Editor button plus terminal and folder icon buttons; \"all\" gives three labelled buttons. A missing project disables all of them.",
    "The styles live in projectParts.css, imported by the module, so any screen gets them.",
  ],
} satisfies CatalogueEntry;
