import type { KeyboardEvent } from "react";
import { THEMES, type ResolvedMode, type ThemeId } from "../../shared/theme";
import { Icon } from "../components/common/Icon";

interface Props { value: ThemeId; mode: ResolvedMode; onChange(id: ThemeId): void }

const STEP: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };

/** One chip per theme. Each swatch carries its own data-theme and data-mode, so it draws with that theme's tokens. */
export function ThemePicker({ value, mode, onChange }: Props) {
  const current = THEMES.findIndex((t) => t.id === value);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = STEP[e.key];
    if (d === undefined || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    e.stopPropagation();
    const next = (current + d + THEMES.length) % THEMES.length;
    onChange(THEMES[next].id);
    (e.currentTarget.children[next] as HTMLElement | undefined)?.focus();
  };
  return (
    <div className="theme-picker" role="radiogroup" aria-label="Theme" onKeyDown={onKeyDown}>
      {THEMES.map((t) => {
        const on = t.id === value;
        return (
          <button key={t.id} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
            className={`theme-chip ${on ? "is-selected" : ""}`} onClick={() => onChange(t.id)}>
            <span className="theme-art" data-theme={t.id} data-mode={mode} aria-hidden="true">
              <span className="theme-art-sheet">
                <span className="theme-art-title" />
                <span className="theme-art-line" />
                <span className="theme-art-line is-short" />
                <span className="theme-art-accent" />
              </span>
            </span>
            <span className="theme-chip-name">
              {t.name}
              {on && <Icon name="check" size={16} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
