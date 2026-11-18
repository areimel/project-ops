import { useId, useRef, useState } from "react";
import { Badge } from "./Badge";
import { SuggestionList, optionId } from "./SuggestionList";
import { addTags, decideKey, filterSuggestions, removeAt } from "./tagInputModel";

interface Props {
  label: string;
  hideLabel?: boolean;
  value: string[];
  onChange(next: string[]): void;
  suggestions?: string[];
  max?: number;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}

/** Tags as removable badges plus a text input. Enter or "," adds, Backspace on empty removes the last, paste splits on commas. */
export function TagInput({ label, hideLabel, value, onChange, suggestions = [], max, maxLength, placeholder, className = "" }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const items = text.trim() || open ? filterSuggestions(suggestions, value, text) : [];
  const showing = open && items.length > 0;
  const limits = { max, maxLength };

  const reset = () => { setText(""); setOpen(false); setActive(-1); };
  const add = (raw: string) => { const next = addTags(value, raw, limits); if (next.length !== value.length) onChange(next); reset(); };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const a = decideKey({
      key: e.key, input: text, open: showing, active, count: items.length, tagCount: value.length, composing: e.nativeEvent.isComposing,
    });
    if (a.type === "add") add(text);
    else if (a.type === "pick") add(items[a.index]);
    else if (a.type === "removeLast") onChange(removeAt(value, value.length - 1));
    else if (a.type === "move") { setOpen(true); setActive(a.to); }
    else if (a.type === "close") { setOpen(false); setActive(-1); }
    if (a.type !== "none") e.preventDefault();
  };

  return (
    <div className={`tag-input-field ${className}`.trim()}>
      <label htmlFor={id} className={hideLabel ? "visually-hidden" : "text-field-label"}>{label}</label>
      <div className="tag-input" role="group" aria-label={`${label}, ${value.length} chosen`} onMouseDown={(e) => { if (e.target !== input.current) { e.preventDefault(); input.current?.focus(); } }}>
        {value.map((t, i) => <Badge key={t} onRemove={() => onChange(removeAt(value, i))}>{t}</Badge>)}
        <input id={id} ref={input} className="tag-input-text" role="combobox" aria-expanded={showing} aria-controls={`${id}-list`}
          aria-autocomplete="list" aria-activedescendant={showing && active >= 0 ? optionId(`${id}-list`, active) : undefined}
          autoComplete="off" spellCheck={false} value={text} placeholder={value.length === 0 ? placeholder : undefined}
          onChange={(e) => { setText(e.target.value); setOpen(true); setActive(-1); }}
          onKeyDown={onKeyDown}
          onPaste={(e) => {
            const raw = e.clipboardData.getData("text");
            if (/[,\n\r]/.test(raw)) { e.preventDefault(); add(text + raw); }
          }}
          onBlur={() => { if (text.trim()) add(text); else reset(); }} />
      </div>
      {showing && <SuggestionList id={`${id}-list`} label={`${label} suggestions`} items={items} active={active} onPick={add} onHover={setActive} onClose={() => { setOpen(false); setActive(-1); }} />}
    </div>
  );
}
