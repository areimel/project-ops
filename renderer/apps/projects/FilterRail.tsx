import { useState } from "react";
import type { ProjectStatus } from "../../../shared/projects/record";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { SectionHead } from "../../components/common/SectionHead";
import { cx } from "../../utils/cx";
import { stackLabel } from "./cardModel";
import { cycleTag, visibleTags } from "./filterState";
import { toggle, type Facet, type Facets, type ProjectFilters } from "./projectsModel";

const TAG_LIMIT = 20;

interface Props {
  facets: Facets;
  filters: ProjectFilters;
  filtered: boolean;
  onChange(update: (f: ProjectFilters) => ProjectFilters): void;
  onClear(): void;
}

function tagTitle(t: Facet): string {
  if (t.excluded) return `Hiding projects tagged ${t.label}. Click to stop.`;
  if (t.selected) return `Showing only ${t.label}. Click to hide ${t.label} instead.`;
  return `Show only ${t.label}`;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="projects-rail-group" aria-label={title}>
      <SectionHead title={title} className="projects-rail-title" />
      {children}
    </section>
  );
}

/** One list row: a category (single choice, marked by a bar) or a status (a check square). */
function RailRow({ label, count, selected, check, onClick }: { label: string; count: number; selected: boolean; check?: boolean; onClick(): void }) {
  return (
    <li>
      <button type="button" className={cx("projects-cat", selected && "is-selected", check && "is-check")}
        aria-pressed={selected} onClick={onClick}>
        {check && <span className="projects-check" aria-hidden="true" />}
        <span className="projects-cat-name">{label}</span>
        <span className="projects-cat-count">{count}</span>
      </button>
    </li>
  );
}

/** Category (single choice), tags (off / only / hide), status and stack toggles, with counts. */
export function FilterRail({ facets, filters, filtered, onChange, onClear }: Props) {
  const [allTags, setAllTags] = useState(false);
  const [open, setOpen] = useState(false); // narrow windows only: the rail folds above the grid
  // Every project has one category, so the bucket counts add up to "All" (the result without the category filter).
  const total = facets.categories.reduce((n, c) => n + c.count, 0);
  const tags = visibleTags(facets.tags, TAG_LIMIT, allTags);
  const on = filters.tags.length + filters.excludeTags.length + filters.stack.length + (filters.category === null ? 0 : 1);

  const category = (value: string | null, label: string, count: number) => (
    <RailRow key={value ?? "\u0000all"} label={label} count={count} selected={filters.category === value}
      onClick={() => onChange((f) => ({ ...f, category: value }))} />
  );

  return (
    <aside className={`projects-rail ${open ? "is-open" : ""}`.trim()} aria-label="Filters">
      <button type="button" className="projects-rail-toggle label" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>Filters{on > 0 ? ` (${on})` : ""}</span>
        <Icon name={open ? "chevronUp" : "chevronDown"} size={14} />
      </button>
      <div className="projects-rail-groups">
        <Group title="Category">
          <ul className="projects-cats">
            {category(null, "All", total)}
            {facets.categories.map((c) => category(c.value, c.label, c.count))}
          </ul>
        </Group>

        <Group title="Status">
          <ul className="projects-cats">
            {facets.statuses.map((s) => (
              <RailRow key={s.value} check label={s.label} count={s.count} selected={s.selected}
                onClick={() => onChange((f) => ({ ...f, statuses: toggle(f.statuses, s.value as ProjectStatus) }))} />
            ))}
          </ul>
        </Group>

        {facets.tags.length === 0 && !facets.tagsExist ? (
          <Group title="Tags"><p className="hint">No tags yet. Edit a project to add some.</p></Group>
        ) : facets.tags.length > 0 && (
          <Group title="Tags">
            <div className="chip-row">
              {tags.shown.map((t) => (
                <Badge key={t.value} variant="tag" count={t.count} pressed={t.selected} excluded={t.excluded} title={tagTitle(t)}
                  onClick={() => onChange((f) => cycleTag(f, t.value))}>{t.label}</Badge>
              ))}
            </div>
            {(tags.hidden > 0 || allTags) && (
              <Button variant="link" className="projects-more" onClick={() => setAllTags((a) => !a)}>
                {allTags ? "Show fewer" : `Show all ${facets.tags.length}`}
              </Button>
            )}
          </Group>
        )}

        {facets.stack.length > 0 && (
          <Group title="Stack">
            <div className="chip-row">
              {facets.stack.map((s) => (
                <Badge key={s.value} count={s.count} pressed={s.selected}
                  onClick={() => onChange((f) => ({ ...f, stack: toggle(f.stack, s.value) }))}>{stackLabel(s.label)}</Badge>
              ))}
            </div>
          </Group>
        )}

        {filtered && (
          <div className="projects-rail-foot">
            <Button variant="quiet" icon="close" onClick={onClear}>Clear filters</Button>
          </div>
        )}
      </div>
    </aside>
  );
}
