import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { useDismiss } from "../../hooks/useDismiss";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

const focusables = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);

interface Props {
  title: string;
  onClose(): void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

/**
 * Modal dialog. On open, focus goes to `[data-autofocus]`, else the first control in the body or footer,
 * else the close button. Tab stays inside, Escape and the backdrop close it, focus goes back on close.
 */
export function Dialog({ title, onClose, children, footer, size = "md" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDismiss(ref, () => onClose(), { outside: false });

  useEffect(() => {
    const returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = ref.current!;
    const inContent = [...root.querySelectorAll<HTMLElement>(".dialog-body, .dialog-foot")].flatMap(focusables);
    const target = root.querySelector<HTMLElement>("[data-autofocus]") ?? inContent[0] ?? focusables(root)[0] ?? root;
    target.focus();
    return () => { if (returnTo?.isConnected) returnTo.focus(); };
  }, []);

  const trap = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const list = focusables(e.currentTarget);
    if (!list.length) { e.preventDefault(); return; }
    const [first, last] = [list[0], list[list.length - 1]];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === e.currentTarget)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <div className="dialog-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`dialog dialog-${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId}
        tabIndex={-1} onKeyDown={trap}>
        <div className="dialog-head">
          <h2 id={titleId} className="dialog-title">{title}</h2>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}

/** A yes/no question. Cancel comes first in the footer and so takes the initial focus. */
export function ConfirmDialog(p: {
  title: string; body?: string; confirmLabel: string; cancelLabel?: string; danger?: boolean;
  onConfirm(): void; onCancel(): void;
}) {
  return (
    <Dialog title={p.title} size="sm" onClose={p.onCancel}
      footer={<>
        <Button variant="quiet" onClick={p.onCancel}>{p.cancelLabel ?? "Cancel"}</Button>
        <Button variant={p.danger ? "danger" : "primary"} onClick={p.onConfirm}>{p.confirmLabel}</Button>
      </>}>
      {p.body && <p className="confirm-body">{p.body}</p>}
    </Dialog>
  );
}
