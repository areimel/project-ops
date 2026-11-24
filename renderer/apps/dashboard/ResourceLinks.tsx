import type { ResourceLinkView } from "../../../shared/resources/links";
import { Button } from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { IconButton } from "../../components/common/IconButton";
import { groupLinks } from "./dashboardModel";

interface Props {
  links: readonly ResourceLinkView[];
  full: boolean;
  onOpen(id: string): void;
  onEdit(id: string): void;
  onAdd(): void;
}

/** The owner's links under their group headings. A link opens in the browser; the pencil beside it edits it. */
export function ResourceLinks({ links, full, onOpen, onEdit, onAdd }: Props) {
  const groups = groupLinks(links);
  return (
    <section className="dashboard-section" aria-label="Resources">
      <div className="dashboard-section-head">
        <h2 className="kicker">Resources</h2>
        <Button variant="quiet" icon="plus" disabled={full} title={full ? "The list is full. Remove a link to add another." : undefined}
          onClick={onAdd}>Add link</Button>
      </div>
      {groups.length === 0 ? (
        <p className="dashboard-hint">Keep the tools you open all the time here: hosting, domains, analytics. They open in your browser.</p>
      ) : (
        <div className="card-grid dashboard-links">
          {groups.map((g) => (
            <div key={g.group} className="dashboard-link-group">
              <h3 className="label dashboard-link-group-name">{g.group === "" ? "General" : g.group}</h3>
              <ul className="dashboard-link-list" aria-label={g.group === "" ? "General links" : `${g.group} links`}>
                {g.links.map((l) => (
                  <li key={l.id} className="dashboard-link">
                    <button type="button" className="dashboard-link-open" title={l.url} onClick={() => onOpen(l.id)}>
                      <span className="dashboard-link-name">{l.name}</span><Icon name="arrowUpRight" size={12} />
                    </button>
                    <IconButton icon="pencil" label={`Edit ${l.name}`} className="dashboard-link-edit" onClick={() => onEdit(l.id)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
