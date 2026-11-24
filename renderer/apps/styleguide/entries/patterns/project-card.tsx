import { ProjectCard } from "../../../projects/ProjectCard";
import { FIXTURE_NOW, NOOP_CARD_ACTIONS, PROJECTS } from "../../fixtures";
import type { CatalogueEntry } from "../../types";

const single = (p: typeof PROJECTS.pinned, selected = false) => (
  <ul className="card-grid projects-grid" aria-label={p.name} style={{ "--card-min": "100%" } as React.CSSProperties}>
    <ProjectCard project={p} selected={selected} now={FIXTURE_NOW} actions={NOOP_CARD_ACTIONS} />
  </ul>
);

export const entry = {
  id: "project-card",
  title: "Project card",
  family: "patterns",
  source: "renderer/apps/projects/ProjectCard.tsx",
  exports: ["ProjectCard", "CardActions"],
  purpose: "One project on the Projects grid: category, status, name, description, tags, trait rows and the buttons that open it. It is the main way a project is shown and acted on.",
  useFor: [
    "Listing projects in the Projects grid, where every card is a list item of one card-grid list.",
    "Any list of projects that needs open, copy path, pin and edit within reach.",
    "Showing a missing folder (muted, open buttons disabled) or an archived project (muted) without extra code.",
  ],
  notFor: [
    "A compact pointer to a project, such as pinned and recent projects on the dashboard: use ProjectTile.",
    "The full page of one project: use the dossier (ProjectDossier).",
    "A card for something that is not a project: compose Card, CardHeader, CardBody and CardFooter.",
  ],
  snippet: "<ul className=\"card-grid projects-grid\" aria-label={label}>\n  {list.map((p) => (\n    <ProjectCard key={p.id} project={p}\n      selected={p.id === selected}\n      now={now} actions={actions} />\n  ))}\n</ul>\n// actions: one stable CardActions object, addressed by project id\n// now: a timestamp passed in, so relative times agree across cards",
  specimens: [
    {
      label: "Three cards in the real grid", wide: true,
      render: () => (
        <ul className="card-grid projects-grid" aria-label="Projects">
          {[PROJECTS.pinned, PROJECTS.dirty, PROJECTS.noGit].map((p) => (
            <ProjectCard key={p.id} project={p} selected={false} now={FIXTURE_NOW} actions={NOOP_CARD_ACTIONS} />
          ))}
        </ul>
      ),
    },
    { label: "Pinned, with tags and links", width: 320, render: () => single(PROJECTS.pinned) },
    { label: "Uncommitted changes", width: 320, render: () => single(PROJECTS.dirty) },
    { label: "No git", width: 320, render: () => single(PROJECTS.noGit) },
    { label: "Paused", width: 320, render: () => single(PROJECTS.paused) },
    { label: "Archived (muted)", width: 320, render: () => single(PROJECTS.archived) },
    { label: "Missing folder", width: 320, render: () => single(PROJECTS.missing) },
    { label: "Selected (the revealed card)", width: 320, render: () => single(PROJECTS.manual, true) },
  ],
  notes: [
    "Anatomy, top to bottom: CardHeader with the category as a button (filters by it) and the StatusDot; the name as a button that opens the project page, with a pin icon when pinned; the description; tags as tag Badges (six at most, then +N); trait rows; footer.",
    "Trait rows come from traitRows in cardModel.ts: Branch and Last commit (GitRows), or one Git: None row when the folder is not a repository, then Stack and Links only when set, then Folder.",
    "Footer: OpenActions (a labelled Editor button, terminal and folder as icon buttons), copy path, then pin and edit pushed to the end. A missing folder disables the three open buttons, and the status light says Missing.",
    "The card needs the card-grid and projects-grid classes on its list; projects.css must be loaded. Cards are li elements, so the parent must be a ul or ol. Single-card specimens override --card-min so one card fills the box.",
    "Actions are addressed by project id (CardActions), so one object serves every card and the memo stays effective.",
  ],
} satisfies CatalogueEntry;
