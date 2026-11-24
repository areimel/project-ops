import { KeyValue, KeyValueList } from "../../components/common/KeyValue";
import { ALL_TOKENS } from "../../theme/tokenList";
import { Barcode, DotGrid, HazardBand, RegMarks, Stamp } from "../projects/dossier/DossierGraphics";
import type { CatalogueEntry } from "./types";

const SERIAL = "5c0e1d94a7b3f268";

interface Props { entries: readonly CatalogueEntry[] }

/** The page's one bold moment: a spec plate in the manner of the dossier's file plate. */
export function PlateHeader({ entries }: Props) {
  const patterns = entries.filter((e) => e.family === "patterns").length;
  const components = entries.filter((e) => e.family !== "patterns" && e.family !== "foundations").length;
  return (
    <header className="styleguide-plate">
      <HazardBand>Interface parts catalogue</HazardBand>
      <div className="styleguide-plate-body">
        <RegMarks />
        <div className="styleguide-plate-main">
          <h1 className="styleguide-plate-title">Styleguide</h1>
          <p className="styleguide-plate-lead">Every token, component and pattern of this app, drawn from the code it ships, in light and dark.</p>
        </div>
        <div className="styleguide-plate-side">
          <KeyValueList className="styleguide-plate-table">
            <KeyValue label="Theme">Kojima</KeyValue>
            <KeyValue label="Components">{String(components)}</KeyValue>
            <KeyValue label="Patterns">{String(patterns)}</KeyValue>
            <KeyValue label="Tokens">{String(ALL_TOKENS.length)}</KeyValue>
            <KeyValue label="Version">{__APP_VERSION__}</KeyValue>
          </KeyValueList>
          <div className="styleguide-plate-stamp"><Stamp>Dev build</Stamp><DotGrid /></div>
        </div>
      </div>
      <div className="styleguide-plate-foot">
        <p className="styleguide-plate-limits">
          Hover, focus and pressed states are live: point at a part or press Tab. A click outside closes a pre-opened menu; Reset specimens opens it again.
        </p>
        <div className="styleguide-plate-code">
          <Barcode id={SERIAL} height={28} />
          <span className="styleguide-plate-serial label">Serial {SERIAL}</span>
        </div>
      </div>
    </header>
  );
}
