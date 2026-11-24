import { useId, type InputHTMLAttributes, type Ref } from "react";
import { FieldError, FieldLabel } from "./Field";
import { joinIds } from "./fieldModel";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string; hideLabel?: boolean; value: string; onChange(v: string): void; onEnter?(): void;
  type?: "text" | "search" | "number" | "date";
  /** Draws the error border and sets `aria-invalid`. Say what is wrong in text next to the field (or use `error`). */
  invalid?: boolean;
  /** What is wrong, in words: shown under the field, linked with `aria-describedby`, and marks it invalid. */
  error?: string;
  /** The inner `<input>`, for focusing it. */
  ref?: Ref<HTMLInputElement>;
};

/** A single-line input with its label. `hideLabel` keeps the label for assistive tech only. */
export function TextField({ label, hideLabel, value, onChange, onEnter, invalid, error, className, id, ...rest }: Props) {
  const auto = useId();
  const inputId = id ?? auto;
  const errorId = `${inputId}-error`;
  return (
    <div className={`text-field ${className ?? ""}`.trim()}>
      <FieldLabel htmlFor={inputId} hidden={hideLabel}>{label}</FieldLabel>
      <input {...rest} id={inputId} aria-invalid={invalid || error ? true : undefined}
        aria-describedby={joinIds(rest["aria-describedby"], error && errorId)}
        value={value} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { rest.onKeyDown?.(e); if (e.key === "Enter") onEnter?.(); }} />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
