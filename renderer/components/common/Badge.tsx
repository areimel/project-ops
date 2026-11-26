import { cx } from "../../utils/cx";

export type BadgeVariant = "outline" | "solid" | "quiet" | "tag";

interface Props {
  children: string;
  variant?: BadgeVariant;
  /** Makes the badge a toggle button. Pair with `pressed` and, for "must not have", `excluded`. */
  onClick?(): void;
  pressed?: boolean;
  /** A third toggle state (strike-through, danger border). Reported as `aria-pressed="mixed"`. */
  excluded?: boolean;
  /** Adds a close button labelled "Remove <text>". */
  onRemove?(): void;
  count?: number;
  title?: string;
  className?: string;
}

/** A small mono label chip: plain, a toggle filter, a removable tag, or both of the last two. `variant="tag"` is for the owner's own words (tags, services): text face, sentence case. */
export function Badge({ children, variant = "outline", onClick, pressed, excluded, onRemove, count, title, className = "" }: Props) {
  const cls = cx("badge", `badge-${variant}`, pressed && "is-pressed", excluded && "is-excluded", className);
  const inner = (
    <>
      <span className="badge-text">{children}</span>
      {count !== undefined && <span className="badge-count">{count}</span>}
    </>
  );
  return (
    <span className={cls} title={title}>
      {onClick ? (
        <button type="button" className="badge-main" aria-pressed={excluded ? "mixed" : !!pressed} onClick={onClick}>{inner}</button>
      ) : inner}
      {onRemove && (
        <button type="button" className="badge-remove" aria-label={`Remove ${children}`} onClick={onRemove}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square" aria-hidden="true">
            <path d="M5 5l14 14 M19 5L5 19" />
          </svg>
        </button>
      )}
    </span>
  );
}
