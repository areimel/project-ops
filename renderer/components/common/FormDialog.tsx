import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { saveStep } from "./fieldModel";

interface Props<P> {
  title: string;
  size?: "sm" | "md" | "lg";
  /** The primary button, such as "Save changes". */
  saveLabel: string;
  /** True while the draft cannot be saved: the primary button is disabled and Enter does nothing. */
  invalid: boolean;
  /** Builds what to save from the owner's draft; null means nothing changed, and the dialog just closes. */
  patch(): P | null;
  /** Resolves true when saved; the dialog then closes. */
  onSave(patch: P): Promise<boolean>;
  /** Shows a Remove button at the start of the footer. The owner decides what removing asks and does. */
  onRemove?(): void;
  removeLabel?: string;
  onClose(): void;
  /** Extra classes for the `<form>`, such as `form-grid`. */
  formClassName?: string;
  /** Show the dialog in place (the styleguide); see `Dialog`. */
  inline?: boolean;
  children: ReactNode;
}

/**
 * A dialog around one form: Enter or the primary button saves, Cancel and Escape close. It owns the `saving`
 * state, so the primary button is disabled while a save is running and a second submit is ignored.
 */
export function FormDialog<P>({
  title, size, saveLabel, invalid, patch, onSave, onRemove, removeLabel = "Remove", onClose, formClassName, inline, children,
}: Props<P>) {
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const step = saveStep(invalid || saving, patch);
    if (step.kind === "ignore") return;
    if (step.kind === "close") { onClose(); return; }
    setSaving(true);
    let ok = false;
    try {
      ok = await onSave(step.patch);
    } finally {
      setSaving(false);   // a save that throws must not leave the form stuck on "saving"
    }
    if (ok) onClose();
  };

  return (
    <Dialog title={title} size={size} onClose={onClose} inline={inline}
      footer={<>
        {onRemove && <Button variant="quiet" icon="trash" className="dialog-foot-start" onClick={onRemove}>{removeLabel}</Button>}
        <Button variant="quiet" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={invalid || saving} onClick={save}>{saveLabel}</Button>
      </>}>
      <form className={formClassName} onSubmit={(e) => { e.preventDefault(); void save(); }}>
        {children}
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
