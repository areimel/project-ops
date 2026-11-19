import { useRef } from "react";
import { useDismiss } from "../../hooks/useDismiss";

/** The listbox under a combobox input. The input owns focus; `aria-activedescendant` points at the highlighted row. */
export const optionId = (listId: string, i: number) => `${listId}-opt-${i}`;

interface Props {
  id: string;
  label: string;
  items: readonly string[];
  active: number;
  onPick(item: string): void;
  onHover?(index: number): void;
  /** Escape pressed while the list is showing. The list is its own dismiss layer, so a dialog around it stays open. */
  onClose(): void;
}

export function SuggestionList({ id, label, items, active, onPick, onHover, onClose }: Props) {
  const ref = useRef<HTMLUListElement>(null);
  useDismiss(ref, onClose, { outside: false }); // mounted only while showing
  return (
    <ul ref={ref} id={id} role="listbox" aria-label={label} className="dropdown-menu suggestion-list">
      {items.map((s, i) => (
        <li key={s} id={optionId(id, i)} role="option" aria-selected={i === active}
          className={`dropdown-item ${i === active ? "is-active" : ""}`.trim()}
          onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => onHover?.(i)} onClick={() => onPick(s)}>
          {s}
        </li>
      ))}
    </ul>
  );
}
