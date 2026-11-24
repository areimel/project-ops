import { useState } from "react";
import { Button } from "../../components/common/Button";
import { useShell } from "../../shell/ShellContext";
import { Stamp } from "../projects/dossier/DossierGraphics";
import { SpecimenBoundary } from "./SpecimenBoundary";
import { SpecimenFrames } from "./SpecimenFrame";
import { anchorId, sheetSerial, spansRow, stackFrames, FAMILIES, type ModeChoice } from "./styleguideModel";
import type { CatalogueEntry, Specimen } from "./types";

function Cell({ s }: { s: Specimen }) {
  const style = s.width ? { width: `min(100%, ${s.width}px)` } : undefined;
  return (
    <div className={`styleguide-cell${spansRow(s) ? " is-wide" : ""}`}>
      <p className="styleguide-cell-label label">
        {s.label}
        {s.notInUse && <span className="styleguide-cell-tag">Not in use yet</span>}
      </p>
      <div className="styleguide-specimen" style={{ ...style, minHeight: s.minHeight }}>
        <SpecimenBoundary label={s.label}>{s.render()}</SpecimenBoundary>
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="styleguide-use">
      <h3 className="styleguide-use-head label">{title}</h3>
      <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  );
}

interface Props { entry: CatalogueEntry; index: number; choice: ModeChoice }

/** The one renderer every catalogue entry goes through. */
export function Sheet({ entry, index, choice }: Props) {
  const { toast } = useShell();
  const [round, setRound] = useState(0);
  const heading = `${anchorId(entry.id)}-title`;
  const family = FAMILIES.find((f) => f.id === entry.family)?.title ?? entry.family;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entry.snippet);
      toast("success", "Copied");
    } catch {
      toast("error", "Could not copy the snippet");
    }
  };

  return (
    <section id={anchorId(entry.id)} className="styleguide-sheet" aria-labelledby={heading}>
      <header className="styleguide-sheet-head">
        <p className="styleguide-serial label">{sheetSerial(index)} / {family}</p>
        <h2 id={heading} className="styleguide-sheet-title">{entry.title}</h2>
        {entry.status === "not-in-use" && <span className="styleguide-sheet-stamp"><Stamp tone="muted">Not in use yet</Stamp></span>}
        <p className="styleguide-source">
          <code>{entry.source}</code>
          {entry.exports && entry.exports.length > 0 && <span className="styleguide-exports">Exports <code>{entry.exports.join(", ")}</code></span>}
        </p>
      </header>

      <p className="styleguide-purpose">{entry.purpose}</p>
      <div className="styleguide-uses">
        <List title="Use for" items={entry.useFor} />
        <List title="Not for" items={entry.notFor} />
      </div>
      <div className="styleguide-bar">
        <span className="styleguide-bar-title label">Specimens</span>
        <Button variant="quiet" onClick={() => setRound((r) => r + 1)}>Reset specimens</Button>
      </div>
      <SpecimenFrames key={round} choice={choice} stacked={stackFrames(entry.specimens)}>
        {() => (
          <div className="styleguide-specimens">
            {entry.specimens.map((s) => <Cell key={s.label} s={s} />)}
          </div>
        )}
      </SpecimenFrames>

      {entry.notes && entry.notes.length > 0 && (
        <>
          <div className="styleguide-bar"><span className="styleguide-bar-title label">Notes</span></div>
          <div className="styleguide-notes">{entry.notes.map((n) => <p key={n} className="styleguide-note">{n}</p>)}</div>
        </>
      )}

      <div className="styleguide-bar">
        <span className="styleguide-bar-title label">Snippet</span>
        <Button variant="quiet" onClick={() => void copy()}>Copy</Button>
      </div>
      <pre className="styleguide-snippet"><code>{entry.snippet}</code></pre>
    </section>
  );
}
