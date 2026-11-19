import { useId, useState } from "react";
import { SuggestionList, optionId } from "./SuggestionList";
import { decideKey, filterSuggestions } from "./tagInputModel";

interface Props {
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange(v: string): void;
  suggestions: string[];
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

/** A single-value text input with a suggestion list; free text is allowed. `onChange` fires on every edit and pick. */
export function Combobox({ label, hideLabel, value, onChange, suggestions, placeholder, maxLength, className = "" }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const items = filterSuggestions(suggestions, [], value);
  const showing = open && items.length > 0;
  const pick = (s: string) => { onChange(s); setOpen(false); setActive(-1); };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter and "," mean nothing here beyond picking a highlighted row.
    const a = e.key === "," ? { type: "none" as const } : decideKey({
      key: e.key, input: "", open: showing, active, count: items.length, tagCount: 0, composing: e.nativeEvent.isComposing,
    });
    if (a.type === "pick") pick(items[a.index]);
    else if (a.type === "move") { setOpen(true); setActive(a.to); }
    else if (a.type === "close") { setOpen(false); setActive(-1); }
    if (a.type !== "none") e.preventDefault();
  };

  return (
    <div className={`text-field combobox ${className}`.trim()}>
      <label htmlFor={id} className={hideLabel ? "visually-hidden" : "text-field-label"}>{label}</label>
      <input id={id} role="combobox" aria-expanded={showing} aria-controls={`${id}-list`} aria-autocomplete="list"
        aria-activedescendant={showing && active >= 0 ? optionId(`${id}-list`, active) : undefined}
        autoComplete="off" spellCheck={false} value={value} placeholder={placeholder} maxLength={maxLength}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onKeyDown={onKeyDown} onBlur={() => { setOpen(false); setActive(-1); }} />
      {showing && <SuggestionList id={`${id}-list`} label={`${label} suggestions`} items={items} active={active} onPick={pick} onHover={setActive} onClose={() => { setOpen(false); setActive(-1); }} />}
    </div>
  );
}
