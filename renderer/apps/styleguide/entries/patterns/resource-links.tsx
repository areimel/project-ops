import { ResourceLinks } from "../../../dashboard/ResourceLinks";
import { RESOURCE_LINKS } from "../../fixtures";
import type { CatalogueEntry } from "../../types";

const noop = () => {};

export const entry = {
  id: "resource-links",
  title: "Resource links",
  family: "patterns",
  source: "renderer/apps/dashboard/ResourceLinks.tsx",
  exports: ["ResourceLinks", "groupLinks"],
  purpose: "The owner's own links (hosting, analytics and the like) on the dashboard, under group headings, with an Add link button and a pencil to edit each one. A link opens in the browser.",
  useFor: [
    "The Resources section of the dashboard.",
    "A short list of the owner's named https links that are grouped by a label they chose.",
    "Showing the empty hint when there are no links yet.",
  ],
  notFor: [
    "A project's own repo, site and docs links: use ProjectLinks.",
    "Links that live in the app's chrome, such as help or the website: those come from brand.links.",
    "A long list that needs search: this has no filtering.",
  ],
  snippet: "<ResourceLinks links={links} full={links.length >= 100}\n  onOpen={(id) => openLink(id)}\n  onEdit={(id) => editLink(id)}\n  onAdd={addLink} />\n// groupLinks(links) in dashboardModel.ts: ungrouped first as\n// General, then groups A to Z, names A to Z inside each",
  specimens: [
    {
      label: "Grouped links", wide: true,
      render: () => (
        <div className="dashboard">
          <ResourceLinks links={RESOURCE_LINKS} full={false} onOpen={noop} onEdit={noop} onAdd={noop} />
        </div>
      ),
    },
    {
      label: "Empty", wide: true,
      render: () => (
        <div className="dashboard">
          <ResourceLinks links={[]} full={false} onOpen={noop} onEdit={noop} onAdd={noop} />
        </div>
      ),
    },
    {
      label: "List full (Add link disabled)", wide: true,
      render: () => (
        <div className="dashboard">
          <ResourceLinks links={RESOURCE_LINKS.slice(0, 2)} full onOpen={noop} onEdit={noop} onAdd={noop} />
        </div>
      ),
    },
  ],
  notes: [
    "The component takes links by prop and reports ids; opening, editing and the 100-link limit (full) belong to the dashboard, which owns the dialog.",
    "Groups come from groupLinks: ungrouped links first under General, names that differ only by case are one group.",
    "Empty state is a hint paragraph, not an EmptyState, because the section keeps its Add link button.",
    "Styles are dashboard.css (.dashboard-links, .dashboard-link-*); the section head rule is scoped to .dashboard, so the specimen sits in a plain .dashboard wrapper (it only sets overflow).",
  ],
} satisfies CatalogueEntry;
