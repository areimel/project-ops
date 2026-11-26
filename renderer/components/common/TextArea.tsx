import { useId, type Ref, type TextareaHTMLAttributes } from "react";
import { FieldError, FieldLabel } from "./Field";
import { joinIds } from "./fieldModel";

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
  label: string; hideLabel?: boolean; value: string; onChange(v: string): void; mono?: boolean;
  /** Takes the full height of its parent and stops being resizable. */
  fill?: boolean;
  /** Draws the error border and sets `aria-invalid`. */
  invalid?: boolean;
  /** What is wrong, in words: shown under the field, linked with `aria-describedby`, and marks it invalid. */
  error?: string;
  /** The inner `<textarea>`, for focusing it. */
  ref?: Ref<HTMLTextAreaElement>;
};

/** A multi-line input with its label. `mono` is for the Editor only. */
export function TextArea({ label, hideLabel, value, onChange, mono, fill, invalid, error, className, id, ...rest }: Props) {
  const auto = useId();
  const areaId = id ?? auto;
  const errorId = `${areaId}-error`;
  return (
    <div className={`text-field text-area-wrap ${fill ? "is-fill" : ""}`.trim()}>
      <FieldLabel htmlFor={areaId} hidden={hideLabel}>{label}</FieldLabel>
      <textarea {...rest} id={areaId} aria-invalid={invalid || error ? true : undefined}
        aria-describedby={joinIds(rest["aria-describedby"], error && errorId)}
        className={`text-area ${mono ? "is-mono" : ""} ${fill ? "is-fill" : ""} ${className ?? ""}`.trim()}
        value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
