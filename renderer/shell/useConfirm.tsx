import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog } from "../components/common/Dialog";
import type { ConfirmOptions } from "./ShellContext";

interface Pending { options: ConfirmOptions; resolve(ok: boolean): void }

/** A promise-based confirm dialog. `node` goes into the tree once; a second call cancels the first. */
export function useConfirm(): { confirm(o: ConfirmOptions): Promise<boolean>; open: boolean; node: ReactNode } {
  const [pending, setPending] = useState<Pending | null>(null);
  const current = useRef<Pending | null>(null);

  const settle = useCallback((ok: boolean) => {
    const p = current.current;
    current.current = null;
    setPending(null);
    p?.resolve(ok);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    current.current?.resolve(false);
    const p = { options, resolve };
    current.current = p;
    setPending(p);
  }), []);

  useEffect(() => () => current.current?.resolve(false), []);

  const node = pending && (
    <ConfirmDialog {...pending.options} onConfirm={() => settle(true)} onCancel={() => settle(false)} />
  );
  return { confirm, open: !!pending, node };
}
