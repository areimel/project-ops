import { useEffect, useMemo, useRef } from "react";
import { Segmented } from "../../components/common/Segmented";
import { anchorId, railGroups, railScrollTop, type ModeChoice } from "./styleguideModel";
import type { CatalogueEntry } from "./types";

const MODES: { value: ModeChoice; label: string }[] = [
  { value: "dark", label: "Dark" }, { value: "light", label: "Light" }, { value: "both", label: "Both" },
];

interface Props {
  entries: readonly CatalogueEntry[];
  choice: ModeChoice;
  onChoice(c: ModeChoice): void;
  active: string | null;
  onPick(id: string): void;
}

/** The mode switch (it stays in view with the rail) and the index: one heading per family, one button per sheet. Scrolls on its own when taller than the window. */
export function IndexRail({ entries, choice, onChoice, active, onPick }: Props) {
  const groups = useMemo(() => railGroups(entries), [entries]);
  const rail = useRef<HTMLElement>(null);
  // Keep the current item in view inside the rail. Only the rail's own scrollTop moves: scrollIntoView would also scroll the page.
  useEffect(() => {
    const el = rail.current;
    const item = el?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!el || !item) return;
    const top = item.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
    el.scrollTop = railScrollTop(top, item.offsetHeight, el.scrollTop, el.clientHeight, 48);
  }, [active]);
  const go = (id: string) => {
    document.getElementById(anchorId(id))?.scrollIntoView({ block: "start" });
    onPick(id);
  };
  return (
    <nav className="styleguide-rail" aria-label="Catalogue" ref={rail}>
      <div className="styleguide-rail-mode">
        <span className="label">Show in</span>
        <Segmented<ModeChoice> label="Show specimens in" options={MODES} value={choice} onChange={onChoice} />
      </div>
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
