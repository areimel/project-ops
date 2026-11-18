import type { ReactNode } from "react";

export function SplitPane({ start, end, startWidth = "280px", label }: { start: ReactNode; end: ReactNode; startWidth?: string; label?: string }) {
  return (
    <div className="split-pane" role="group" aria-label={label} style={{ gridTemplateColumns: `${startWidth} 1fr` }}>
      <div className="split-pane-start">{start}</div>
      <div className="split-pane-end">{end}</div>
    </div>
  );
}
