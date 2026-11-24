import { useEffect, useMemo, useRef, useState } from "react";
import { resolveMode } from "../../../shared/theme";
import { useSettings } from "../../hooks/useSettings";
import { useShell, useTitleInfo } from "../../shell/ShellContext";
import { useSystemDark } from "../../theme/useTheme";
import "../dashboard/dashboard.css";
import "../projects/dossier/dossier.css";
import "../projects/projects.css";
import { ENTRIES } from "./catalogue";
import { IndexRail } from "./IndexRail";
import { PlateHeader } from "./PlateHeader";
import { Sheet } from "./Sheet";
import { anchorId, type ModeChoice } from "./styleguideModel";
import { useScrollSpy } from "./useScrollSpy";
import "./styleguide.css";
import "./styleguide-sheet.css";

/** Dev-only parts catalogue: plate header, index rail and one sheet per entry. */
export default function StyleguideApp() {
  const [settings] = useSettings();
  const dark = useSystemDark();
  const { route } = useShell();
  const [choice, setChoice] = useState<ModeChoice>(resolveMode(settings.mode, dark));
  const scroller = useRef<HTMLDivElement>(null);
  const ids = useMemo(() => ENTRIES.map((e) => e.id), []);
  const [active, setActive] = useScrollSpy(scroller, ids);

  useTitleInfo({ count: `${ENTRIES.length} sheets` });

  const target = route.view === "app" ? route.recordId : null;
  useEffect(() => {
    if (target) document.getElementById(anchorId(target))?.scrollIntoView({ block: "start" });
  }, [target]);

  return (
    <div className="app-root styleguide">
      <div className="styleguide-scroll" ref={scroller}>
        <PlateHeader entries={ENTRIES} />
        <div className="styleguide-body">
          <IndexRail entries={ENTRIES} choice={choice} onChoice={setChoice} active={active} onPick={setActive} />
          <main className="styleguide-main">
            {ENTRIES.map((e, i) => <Sheet key={e.id} entry={e} index={i} choice={choice} />)}
          </main>
        </div>
      </div>
    </div>
  );
}

