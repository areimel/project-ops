import type { ReactNode } from "react";

/** A row of controls. `end` is pushed to the right edge. */
export function Toolbar({ label, children, end }: { label: string; children?: ReactNode; end?: ReactNode }) {
  return (
    <div className="toolbar" role="toolbar" aria-label={label}>
      {children}
      {end && <div className="toolbar-end">{end}</div>}
    </div>
  );
}
