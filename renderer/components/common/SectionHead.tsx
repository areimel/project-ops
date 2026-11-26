import { createElement, type ReactNode } from "react";
import { cx } from "../../utils/cx";

interface Props {
  title: string;
  /** Heading level, 2 to 4. */
  level?: 2 | 3 | 4;
  /** Content on the right of the row (a link, a button). */
  end?: ReactNode;
  /** Id of the heading, for `aria-labelledby`. */
  id?: string;
  /** On the row, not the heading: spacing, or `form-wide` in a form grid. */
  className?: string;
}

/** A section heading in the kicker look (muted mono label led by an accent square), with optional content on the right. */
export function SectionHead({ title, level = 2, end, id, className }: Props) {
  return (
    <div className={cx("section-head", className)}>
      {createElement(`h${level}`, { className: "kicker", id }, title)}
      {end}
    </div>
  );
}
