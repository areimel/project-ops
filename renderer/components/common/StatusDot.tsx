export type StatusTone = "accent" | "success" | "muted" | "danger";

/** The solid square status light with its label: "■ ACTIVE". */
export function StatusDot({ tone = "accent", children, className = "" }: { tone?: StatusTone; children: string; className?: string }) {
  return <span className={`status status-${tone} ${className}`.trim()}>{children}</span>;
}
