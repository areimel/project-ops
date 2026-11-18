import type { ReactNode } from "react";

/** A `<dl>` of trait rows. */
export function KeyValueList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <dl className={`kv-list ${className}`.trim()}>{children}</dl>;
}

/** One row: the key in the mono label style, the value truncated with an ellipsis. `title` defaults to the value when it is text. */
export function KeyValue({ label, children, title }: { label: string; children: ReactNode; title?: string }) {
  const tip = title ?? (typeof children === "string" ? children : undefined);
  return (
    <div className="kv-row">
      <dt className="kv-key label">{label}</dt>
      <dd className="kv-value" title={tip}>{children}</dd>
    </div>
  );
}
