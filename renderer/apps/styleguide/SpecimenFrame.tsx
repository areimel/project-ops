import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { ResolvedMode } from "../../../shared/theme";
import { useSettings } from "../../hooks/useSettings";
import { applyTheme } from "../../theme/useTheme";
import { framesFor, type ModeChoice } from "./styleguideModel";

const MODE_NAME: Record<ResolvedMode, string> = { dark: "Dark", light: "Light" };

function Frame({ mode, labelled, children }: { mode: ResolvedMode; labelled: boolean; children: ReactNode }) {
  const [settings] = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  // The frame re-derives every token from its own data-mode and keeps the owner's accent override.
  useLayoutEffect(() => {
    if (ref.current) applyTheme(ref.current, settings.theme, mode, settings.accent);
  }, [settings.theme, mode, settings.accent]);
  return (
    <div className="styleguide-frame" ref={ref} data-theme={settings.theme} data-mode={mode}>
      {labelled && <p className="styleguide-frame-label label">{MODE_NAME[mode]}</p>}
      {children}
    </div>
  );
}

/** One frame per mode of the choice; `children` is called per frame so each gets its own copy of the specimens.
 *  `stacked` puts the two frames of Both under each other (for sheets whose specimens need the full width). */
export function SpecimenFrames({ choice, stacked = false, children }: { choice: ModeChoice; stacked?: boolean; children: (mode: ResolvedMode) => ReactNode }) {
  const modes = framesFor(choice);
  return (
    <div className={`styleguide-frames${modes.length > 1 && !stacked ? " is-both" : ""}`}>
      {modes.map((m) => <Frame key={m} mode={m} labelled={modes.length > 1}>{children(m)}</Frame>)}
    </div>
  );
}
