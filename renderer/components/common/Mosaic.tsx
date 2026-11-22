import { useId, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cx } from "../../utils/cx";

export function Mosaic({ className, children, "aria-label": ariaLabel }: { className?: string; children: ReactNode; "aria-label"?: string }) {
  return <div className={cx("mosaic", className)} aria-label={ariaLabel} role={ariaLabel ? "group" : undefined}>{children}</div>;
}

interface CellProps {
  label?: string;
  end?: ReactNode;
  span?: number;
  rowSpan?: number;
  as?: ElementType;
  className?: string;
  tone?: "accent" | "muted";
  children?: ReactNode;
}

type CellStyle = CSSProperties & { "--span": number; "--row-span"?: number };

export function MosaicCell({ label, end, span = 12, rowSpan, as: Tag = "section", className, tone, children }: CellProps) {
  const labelId = useId();
  const style: CellStyle = { "--span": span };
  if (rowSpan) style["--row-span"] = rowSpan;
  const labelled = Boolean(label) && Tag === "section";
  return (
    <Tag className={cx("mosaic-cell", tone && `mosaic-cell-${tone}`, className)} style={style} aria-labelledby={labelled ? labelId : undefined}>
      {(label || end) && (
        <div className="mosaic-cell-head">
          {label ? <span className="kicker" id={labelId}>{label}</span> : <span />}
          {end ? <div className="mosaic-cell-end">{end}</div> : null}
        </div>
      )}
      {children}
    </Tag>
  );
}
