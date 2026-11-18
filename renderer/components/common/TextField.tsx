import type { InputHTMLAttributes, Ref } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string; hideLabel?: boolean; value: string; onChange(v: string): void; onEnter?(): void;
  type?: "text" | "search" | "number" | "date";
  /** Draws the error border and sets `aria-invalid`. Say what is wrong in text next to the field. */
  invalid?: boolean;
  /** The inner `<input>`, for focusing it. */
  ref?: Ref<HTMLInputElement>;
};

/** A single-line input with its label. `hideLabel` keeps the label for assistive tech only. */
export function TextField({ label, hideLabel, value, onChange, onEnter, invalid, className, ...rest }: Props) {
  return (
    <label className={`text-field ${className ?? ""}`.trim()}>
      <span className={hideLabel ? "visually-hidden" : "text-field-label"}>{label}</span>
      <input {...rest} aria-invalid={invalid || undefined} value={value} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { rest.onKeyDown?.(e); if (e.key === "Enter") onEnter?.(); }} />
    </label>
  );
}
