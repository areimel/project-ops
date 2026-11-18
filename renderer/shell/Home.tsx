import { useEffect, useRef, type KeyboardEvent } from "react";
import { brand } from "../../shared/brand";
import { goCommands } from "../../shared/commands";
import type { AppDefinition } from "../apps/types";
import { Kbd } from "../components/common/Kbd";
import { nextSheetIndex, sheetNumber } from "./shellModel";

/** The sheet index: one ruled row per app, in registry order. Arrows move, Enter opens, digits jump. */
export function Home({ apps, onOpen }: { apps: readonly AppDefinition[]; onOpen(appId: string): void }) {
  const list = useRef<HTMLOListElement>(null);
  const keys = goCommands(apps);
  const rows = () => Array.from(list.current?.querySelectorAll<HTMLButtonElement>(".sheet-row") ?? []);

  useEffect(() => { rows()[0]?.focus(); }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const all = rows();
    const at = all.indexOf(document.activeElement as HTMLButtonElement);
    const next = nextSheetIndex(Math.max(at, 0), e.key, all.length);
    if (next === null) return;
    e.preventDefault();
    all[next]?.focus();
  };

  return (
    <div className="home" onKeyDown={onKeyDown}>
      <div className="home-sheet">
        <div className="home-head">
          <h1 className="home-title">{brand.name}</h1>
          <p className="home-tagline">{brand.tagline}</p>
        </div>
        <ol className="sheet-index" ref={list} aria-label="Sheet index">
          {apps.map((a, i) => (
            <li key={a.id}>
              <button type="button" className="sheet-row" onClick={() => onOpen(a.id)}>
                <span className="sheet-num">{sheetNumber(i)}</span>
                <span className="sheet-name">{a.name}</span>
                <span className="sheet-summary">{a.summary}</span>
                {keys[i]?.accelerator && <span className="sheet-key"><Kbd k={keys[i].accelerator} /></span>}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
