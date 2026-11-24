import { useMemo } from "react";
import { anchorId, railGroups } from "./styleguideModel";
import type { CatalogueEntry } from "./types";

interface Props {
  entries: readonly CatalogueEntry[];
  active: string | null;
  onPick(id: string): void;
}

/** The index: one heading per family, one button per sheet. Scrolls on its own when taller than the window. */
export function IndexRail({ entries, active, onPick }: Props) {
  const groups = useMemo(() => railGroups(entries), [entries]);
  const go = (id: string) => {
    document.getElementById(anchorId(id))?.scrollIntoView({ block: "start" });
    onPick(id);
  };
  return (
    <nav className="styleguide-rail" aria-label="Catalogue">
      {groups.map((g) => (
        <div key={g.id} className="styleguide-rail-group">
          <h2 className="styleguide-rail-head label">{g.title}</h2>
          <ul className="styleguide-rail-list">
            {g.entries.map((e) => (
              <li key={e.id}>
                <button type="button" className="styleguide-rail-item" aria-current={e.id === active ? "true" : undefined} onClick={() => go(e.id)}>
                  {e.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
