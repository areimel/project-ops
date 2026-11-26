import { Button } from "../../../../components/common/Button";
import { SectionHead } from "../../../../components/common/SectionHead";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "section-head",
  title: "SectionHead",
  family: "layout",
  source: "renderer/components/common/SectionHead.tsx",
  exports: ["SectionHead"],
  purpose: "The heading of a section inside a screen: a muted mono kicker led by an accent square, with an optional action on the right. It is a real heading element, so it can be the start of a section's outline.",
  useFor: [
    "The groups of the dashboard: Pinned (with an All projects link), Recent and Resources (with Add link).",
    "The Pinned and Other projects groups of the projects grid, with a class for spacing.",
    "The Site part of the edit dialog, as level 3, inside a form grid (className form-wide).",
  ],
  notFor: [
    "The label strip of one card: use CardHeader, which is a mono strip inside the card.",
    "A label on a single field: use the field's label.",
    "A row of buttons that is not a heading: use Toolbar or btn-row.",
  ],
  snippet: "<SectionHead title=\"Pinned\" end={<Button variant=\"link\" onClick={allProjects}>All projects</Button>} />\n<SectionHead title=\"Site\" level={3} className=\"form-wide\" />",
  specimens: [
    {
      label: "Title only, level 2", wide: true,
      render: () => <SectionHead title="Recent" />,
    },
    {
      label: "With an action on the right", wide: true,
      render: () => <SectionHead title="Pinned" end={<Button variant="link">All projects</Button>} />,
    },
    {
      label: "With a quiet button", wide: true,
      render: () => <SectionHead title="Resources" end={<Button variant="quiet" icon="plus">Add link</Button>} />,
    },
    {
      label: "Level 3", wide: true,
      render: () => <SectionHead title="Site" level={3} />,
    },
    {
      label: "Level 4", wide: true, notInUse: true,
      render: () => <SectionHead title="Client, hosting, launch date" level={4} />,
    },
    {
      label: "Under a head: hint and muted text", wide: true,
      render: () => (
        <div className="styleguide-stack">
          <SectionHead title="Recent" />
          <p className="hint">Projects you open in an editor, a terminal or the file manager are listed here, newest first.</p>
          <p className="text-muted">Last edited 3 days ago</p>
        </div>
      ),
    },
  ],
  notes: [
    "The heading level is 2 by default. Screens use level 2 for their groups and level 3 inside a dialog or a form; level 4 is not used yet.",
    "hint (renderer/styles/base.css) is the small muted paragraph that explains a section or an empty state. text-muted is only the muted colour, for a single span or line of metadata.",
    "className is for spacing on the row only, such as projects-group or form-wide; it never changes the heading.",
  ],
} satisfies CatalogueEntry;
