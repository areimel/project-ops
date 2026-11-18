import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useDismiss } from "../../hooks/useDismiss";
import { Icon, type IconName } from "./Icon";

export interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  icon?: IconName;
  className?: string;
  label: string;
  options: Option<T>[];
  selected: T;
  /** Greys the button out. An empty option list does the same. */
  disabled?: boolean;
  buttonText?: string;
  onSelect: (v: T) => void;
  /** Which side the menu opens on. Default "below". */
  placement?: "below" | "above";
}

export function Dropdown<T extends string | number>(p: Props<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);

  const unavailable = p.disabled || p.options.length === 0;
  const close = (refocus: boolean) => { setOpen(false); if (refocus) btn.current?.focus(); };
  const show = () => {
    if (unavailable) return;
    setActive(Math.max(0, p.options.findIndex((o) => o.value === p.selected)));
    setOpen(true);
  };
  useDismiss(ref, (reason) => close(reason === "escape"), { enabled: open });

  useEffect(() => {
    if (open) (menu.current?.children[active] as HTMLElement | undefined)?.focus();
  }, [open, active]);

  const choose = (v: T) => { p.onSelect(v); close(true); };
  const onMenuKey = (e: KeyboardEvent) => {
    const n = p.options.length;
    if (n === 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") setActive((a) => (a + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(n - 1);
    else if (e.key === "Enter" || e.key === " ") choose(p.options[active].value);
    else if (e.key === "Tab") { close(true); return; } // default Tab then moves on from the button
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`dropdown ${p.className ?? ""}`} ref={ref}>
      <button type="button" ref={btn} className="icon-btn dropdown-btn" title={p.label} aria-label={p.label}
        aria-haspopup="listbox" aria-expanded={open} disabled={unavailable} onClick={() => (open ? close(false) : show())}
        onKeyDown={(e) => { if (!open && e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); show(); } }}>
        {p.icon && <Icon name={p.icon} />}
        {p.buttonText && <span className="dropdown-text">{p.buttonText}</span>}
        {p.buttonText && <Icon name="chevronDown" size={14} />}
      </button>
      {open && !unavailable && (
        <ul className={`dropdown-menu ${p.placement === "above" ? "is-above" : ""}`.trim()} role="listbox" aria-label={p.label} ref={menu} onKeyDown={onMenuKey}>
          {p.options.map((o, i) => {
            const on = o.value === p.selected;
            return (
              <li key={String(o.value)} role="option" aria-selected={on} tabIndex={-1}
                className={`dropdown-item ${on ? "is-selected" : ""}`.trim()}
                onMouseEnter={() => setActive(i)} onClick={() => choose(o.value)}>
                {o.label}
                {on && <span className="dropdown-item-check"><Icon name="check" size={16} /></span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
