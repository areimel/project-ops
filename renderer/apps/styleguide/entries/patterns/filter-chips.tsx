import { ActiveFilters } from "../../../projects/ActiveFilters";
import { Badge } from "../../../../components/common/Badge";
import { cycleTag, tagState } from "../../../projects/filterState";
import { defaultFilters, type ProjectFilters } from "../../../projects/projectsModel";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

const several: ProjectFilters = {
  ...defaultFilters(),
  category: "Clients",
  tags: ["astro", "launch"],
  excludeTags: ["wordpress"],
  statuses: ["active", "paused", "archived"],
  stack: ["typescript"],
};
const TAGS = [{ tag: "astro", count: 6 }, { tag: "launch", count: 3 }, { tag: "wordpress", count: 4 }];
const noop = () => {};

export const entry = {
  id: "filter-chips",
  title: "Filter chips",
  family: "patterns",
  source: "renderer/apps/projects/ActiveFilters.tsx",
  exports: ["ActiveFilters", "activeFilters", "cycleTag", "tagState"],
  purpose: "The bar of removable chips under the Projects toolbar, one per filter in force, so a hidden project always has a visible reason. The rail's tag badges drive it through a three-state cycle.",
  useFor: [
    "Showing every active filter except search as a chip with a remove button, plus Clear all when there are two or more.",
    "Rail tags that cycle off, include (pressed), exclude (struck through) on each click.",
    "Any filtered list where the owner must see why items are missing.",
  ],
  notFor: [
    "The search text: it has its own field and never becomes a chip.",
    "Tags on a card or a form: use a tag Badge, or TagInput for editing.",
    "A single on/off choice: use Switch or a pressed Badge without the cycle.",
  ],
  snippet: "const chips = activeFilters(filters); // pure, in filterState.ts\n<ActiveFilters filters={filters}\n  onChange={(update) => setFilters(update)}\n  onClear={clearAll} />\n// rail tag:\n<Badge variant=\"tag\" count={t.count}\n  pressed={t.selected} excluded={t.excluded}\n  onClick={() => onChange((f) => cycleTag(f, t.value))}>\n  {t.label}\n</Badge>",
  specimens: [
    {
      label: "Several active filters", wide: true,
      render: () => <ActiveFilters filters={several} onChange={noop} onClear={noop} />,
    },
    {
      label: "One filter (no Clear all)", wide: true,
      render: () => <ActiveFilters filters={{ ...defaultFilters(), category: "Internal" }} onChange={noop} onClear={noop} />,
    },
    {
      label: "Live: click a tag to cycle it, remove a chip to undo", wide: true,
      render: () => (
        <Live<ProjectFilters> initial={{ ...defaultFilters(), tags: ["astro"] }}>
          {(filters, set) => (
            <div className="styleguide-stack">
              <div className="chip-row">
                {TAGS.map(({ tag, count }) => {
                  const state = tagState(filters, tag);
                  return (
                    <Badge key={tag} variant="tag" count={count} pressed={state === "include"} excluded={state === "exclude"}
                      title={`${tag}: ${state}`} onClick={() => set(cycleTag(filters, tag))}>{tag}</Badge>
                  );
                })}
              </div>
              <ActiveFilters filters={filters} onChange={(update) => set(update(filters))} onClear={() => set(defaultFilters())} />
              <p className="styleguide-muted styleguide-small">Nothing active: the bar renders nothing at all.</p>
            </div>
          )}
        </Live>
      ),
    },
  ],
  notes: [
    "The rule: every filter except search shows as a removable chip. activeFilters(f) in filterState.ts returns one chip per category, included tag (Tag: x), excluded tag (Not: x), changed status set and stack; each carries a remove function that takes only that filter off.",
    "Build ProjectFilters with defaultFilters() and override fields; never hand-write the defaults, because the status default (active and paused) is what decides whether a Status chip appears.",
    "The rail's tag Badge is pressed when included and excluded when excluded; cycleTag moves off, include, exclude, off and never puts a tag in both lists.",
    "The bar has role group and the label Active filters; it needs projects.css (.projects-active).",
  ],
} satisfies CatalogueEntry;
