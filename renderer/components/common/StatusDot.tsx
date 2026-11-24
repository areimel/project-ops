import { cx } from "../../utils/cx";

export type StatusTone = "accent" | "success" | "muted" | "danger";

interface Props {
  tone?: StatusTone;
  children: string;
  className?: string;
  /** Show only the light; the label stays for assistive technology. */
  hideLabel?: boolean;
}

/** The solid square status light with its label: "■ ACTIVE". */
export function StatusDot({ tone = "accent", children, className, hideLabel }: Props) {
  return <span className={cx("status", `tone-${tone}`, className)}>{hideLabel ? <span className="visually-hidden">{children}</span> : children}</span>;
}
