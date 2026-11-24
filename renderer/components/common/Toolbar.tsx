import type { ReactNode } from "react";
import { cx } from "../../utils/cx";

interface Props {
  label: string;
  children?: ReactNode;
  /** Pushed to the right edge. */
  end?: ReactNode;
  className?: string;
  /** "page": the bar at the top of a screen, with the screen's side padding. */
  inset?: "page";
}

/** A row of controls. `end` is pushed to the right edge. */
export function Toolbar({ label, children, end, className, inset }: Props) {
  return (
    <div className={cx("toolbar", inset === "page" && "is-page", className)} role="toolbar" aria-label={label}>
      {children}
      {end && <div className="toolbar-end">{end}</div>}
    </div>
  );
}
