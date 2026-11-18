import { useCallback, useRef, useState } from "react";
import { IconButton } from "./IconButton";

export type ToastKind = "info" | "success" | "error";
export interface ToastAction { label: string; run: () => void }  // e.g. Undo
export interface ToastItem { id: number; kind: ToastKind; message: string; action?: ToastAction }

export function useToasts(): {
  items: ToastItem[]; push(kind: ToastKind, message: string, action?: ToastAction): void; dismiss(id: number): void;
} {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback((kind: ToastKind, message: string, action?: ToastAction) => {
    const id = nextId.current++;
    setItems((l) => [...l.slice(-3), { id, kind, message, action }]);
    // A toast with an action (Undo) stays until it is used or dismissed: a timer is too short to reach it by keyboard.
    if (!action) setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);
  return { items, push, dismiss };
}

export function ToastHost({ items, onDismiss }: { items: ToastItem[]; onDismiss(id: number): void }) {
  return (
    <div className="toast-host" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`} role={t.kind === "error" ? "alert" : undefined}>
          <span>{t.message}</span>
          {t.action && (
            <span className="toast-actions">
              <button type="button" className="btn btn-link" onClick={() => { t.action?.run(); onDismiss(t.id); }}>{t.action.label}</button>
              <IconButton icon="close" label="Dismiss" onClick={() => onDismiss(t.id)} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
