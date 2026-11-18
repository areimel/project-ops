import { cx } from "../../utils/cx";
import type { ElementType, HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLElement> {
  /** The element to render. Default "article". */
  as?: "article" | "section" | "div" | "li";
  /** Dimmed text (missing or archived); the border and focus ring stay clear. */
  muted?: boolean;
  /** Accent border: the chosen or deep-linked card. */
  selected?: boolean;
}

/** A flat, hairline-bordered square. Compose with CardHeader, CardBody and CardFooter. Give it an `aria-label` when it is a landmark. */
export function Card({ as = "article", muted, selected, className = "", ...rest }: CardProps) {
  const Tag: ElementType = as;
  return <Tag className={cx("card", muted && "is-muted", selected && "is-selected", className)} {...rest} />;
}

/** A mono-label strip: `start` on the left ("01 / Personal"), `end` on the right (a StatusDot). */
export function CardHeader({ start, end, className = "" }: { start?: ReactNode; end?: ReactNode; className?: string }) {
  return (
    <div className={`card-header label ${className}`.trim()}>
      <span className="card-header-start">{start}</span>
      {end !== undefined && <span className="card-header-end">{end}</span>}
    </div>
  );
}

export function CardBody({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card-body ${className}`.trim()} {...rest} />;
}

/** An action row under a top rule. */
export function CardFooter({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card-footer ${className}`.trim()} {...rest} />;
}
