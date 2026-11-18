import type { HTMLAttributes, ReactNode } from "react";

export function List({ label, className, ...rest }: HTMLAttributes<HTMLUListElement> & { label: string }) {
  return <ul {...rest} className={`list ${className ?? ""}`.trim()} aria-label={label} />;
}

/**
 * One row. With `onSelect` the title is the button that selects it; without it the title is plain text
 * (use that when the row's own control, such as a checkbox, does the work). `secondary` is a quieter second
 * line under the title; `wrap` lets the title run to several lines instead of cutting it with an ellipsis.
 * `optionId` makes the row an option of a listbox (give the `List` `role="listbox"`): the row itself is clicked,
 * `selected` becomes `aria-selected`, and focus stays wherever the owner keeps it (a combobox input).
 */
export function ListRow(p: {
  selected?: boolean; onSelect?(): void; leading?: ReactNode; title: ReactNode; secondary?: ReactNode;
  wrap?: boolean; meta?: ReactNode; trailing?: ReactNode; optionId?: string;
}) {
  const body = (
    <>
      <span className="list-row-text">{p.title}</span>
      {p.secondary && <span className="list-row-secondary">{p.secondary}</span>}
    </>
  );
  const cls = `list-row-title ${p.wrap ? "is-wrap" : ""}`.trim();
  const option = p.optionId
    ? { id: p.optionId, role: "option", "aria-selected": !!p.selected, onClick: p.onSelect }
    : {};
  return (
    <li className={`list-row ${p.selected ? "is-selected" : ""}`.trim()} {...option}>
      {p.leading && <span className="list-row-leading">{p.leading}</span>}
      {p.onSelect && !p.optionId
        ? <button type="button" className={cls} aria-current={p.selected || undefined} onClick={p.onSelect}>{body}</button>
        : <div className={cls}>{body}</div>}
      {p.meta && <span className="list-row-meta">{p.meta}</span>}
      {p.trailing && <span className="list-row-trailing">{p.trailing}</span>}
    </li>
  );
}
