import { Button } from "../../../../components/common/Button";
import { Combobox } from "../../../../components/common/Combobox";
import { SectionHead } from "../../../../components/common/SectionHead";
import { TextField } from "../../../../components/common/TextField";
import { ProjectCard } from "../../../projects/ProjectCard";
import { FIXTURE_NOW, NOOP_CARD_ACTIONS, PROJECTS } from "../../fixtures";
import type { CatalogueEntry } from "../../types";

const noop = () => {};

function grid(list: typeof PROJECTS[keyof typeof PROJECTS][]) {
  return (
    <ul className="card-grid projects-grid">
      {list.map((p) => <ProjectCard key={p.id} project={p} selected={false} now={FIXTURE_NOW} actions={NOOP_CARD_ACTIONS} />)}
    </ul>
  );
}

export const entry = {
  id: "section-heads",
  title: "Section heads",
  family: "patterns",
  source: "renderer/components/common/SectionHead.tsx",
  exports: ["SectionHead"],
  purpose: "How a screen titles a section: one SectionHead row (kicker title, optional content at the end), with the spacing set by the screen's own class on the row. The same component serves the dashboard, the grid, the filter rail and a form.",
  useFor: [
    "A dashboard section: the head with a trailing link or button, and a hint line under it when the section is empty.",
    "Groups of cards on a screen, such as Pinned and Other projects.",
    "A titled block inside a rail or a form grid (level 3, with form-wide).",
  ],
  notFor: [
    "The title of the whole screen: the title block in the title bar.",
    "The label of a Mosaic cell: MosaicCell label.",
    "A control's caption: Field or the control's own label.",
  ],
  snippet: "<section className=\"dashboard-section\" aria-label=\"Pinned\">\n  <SectionHead title=\"Pinned\"\n    end={<Button variant=\"link\" onClick={allProjects}>All projects</Button>} />\n  <p className=\"hint dashboard-hint\">Nothing is pinned.</p>\n</section>\n\n<SectionHead title=\"Other projects\" className=\"projects-group\" />\n<SectionHead title=\"Site\" level={3} className=\"form-wide\" />",
  specimens: [
    {
      label: "Dashboard heads with an action and a hint", wide: true,
      render: () => (
        <div className="dashboard" style={{ display: "grid", gap: "var(--sp-6)" }}>
          <section className="dashboard-section" aria-label="Pinned">
            <SectionHead title="Pinned" end={<Button variant="link" onClick={noop}>All projects</Button>} />
            <p className="hint dashboard-hint">Nothing is pinned. Pin a project on the Projects screen to keep it here.</p>
          </section>
          <section className="dashboard-section" aria-label="Resources">
            <SectionHead title="Resources" end={<Button variant="quiet" icon="plus" onClick={noop}>Add link</Button>} />
          </section>
        </div>
      ),
    },
    {
      label: "Filter rail group title", width: 248,
      render: () => (
        <section className="projects-rail-group" aria-label="Status">
          <SectionHead title="Status" className="projects-rail-title" />
          <p className="hint">Rows or chips follow.</p>
        </section>
      ),
    },
    {
      label: "Group heads above a card grid", wide: true,
      render: () => (
        <div style={{ padding: "var(--sp-5)" }}>
          <SectionHead title="Pinned" className="projects-group" />
          {grid([PROJECTS.pinned])}
          <SectionHead title="Other projects" className="projects-group" />
          {grid([PROJECTS.dirty, PROJECTS.paused])}
        </div>
      ),
    },
    {
      label: "Sub-head inside a form grid", width: 480,
      render: () => (
        <section className="form-grid form-wide projects-form-site" aria-label="Site">
          <SectionHead title="Site" level={3} className="form-wide" />
          <TextField label="Client" value="Atlas Coffee" onChange={noop} />
          <Combobox label="Hosting" value="Netlify" onChange={noop} suggestions={["Netlify"]} />
        </section>
      ),
    },
  ],
  notes: [
    "Props: title, level (2 to 4, default 2), end, id and className. className lands on the row, not the heading: use it for spacing or form-wide.",
    "The dashboard row gets min-height and a bottom margin from the rule .dashboard .section-head, so its specimen sits in a plain .dashboard wrapper (it only sets overflow and min-height). The grid heads use .projects-group; the rail uses .projects-rail-title. Without those classes the row has no spacing.",
    "The grid specimen is padded by a wrapper because the real scroll area supplies the page padding; the cards are the real ProjectCard with no-op actions.",
  ],
} satisfies CatalogueEntry;
