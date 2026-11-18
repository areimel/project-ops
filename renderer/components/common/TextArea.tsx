import type { Ref, TextareaHTMLAttributes } from "react";

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
  label: string; hideLabel?: boolean; value: string; onChange(v: string): void; mono?: boolean;
  /** Takes the full height of its parent and stops being resizable. */
  fill?: boolean;
  /** Draws the error border and sets `aria-invalid`. */
  invalid?: boolean;
  /** The inner `<textarea>`, for focusing it. */
  ref?: Ref<HTMLTextAreaElement>;
};

/** A multi-line input with its label. `mono` is for the Editor only. */
export function TextArea({ label, hideLabel, value, onChange, mono, fill, invalid, className, ...rest }: Props) {
  return (
    <label className={`text-field text-area-wrap ${fill ? "is-fill" : ""}`.trim()}>
      <span className={hideLabel ? "visually-hidden" : "text-field-label"}>{label}</span>
      <textarea {...rest} aria-invalid={invalid || undefined}
        className={`text-area ${mono ? "is-mono" : ""} ${fill ? "is-fill" : ""} ${className ?? ""}`.trim()}
        value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
