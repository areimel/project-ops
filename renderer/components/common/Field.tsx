import type { ReactNode } from "react";

/** A label, a control and an optional hint. Pass `htmlFor` when the control has an id. */
export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>{label}</label>
      <div className="field-control">{children}</div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

/** The label of a text control. `hidden` keeps it for assistive tech only. */
export function FieldLabel({ htmlFor, hidden, children }: { htmlFor: string; hidden?: boolean; children: ReactNode }) {
  return <label htmlFor={htmlFor} className={hidden ? "visually-hidden" : "text-field-label"}>{children}</label>;
}

/** What is wrong with a control, in words. Link it from the control with `aria-describedby={id}`. */
export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return <p className="field-error" id={id}>{children}</p>;
}
