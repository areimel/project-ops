import { useCallback } from "react";
import { isSuperseded } from "../../shared/superseded";
import { useShell } from "../shell/ShellContext";
import { errorMessage } from "../utils/errorMessage";

type Success<T> = string | ((result: T) => string | null);

/**
 * Runs one mutation and turns its failure into an error toast: main's message, or `failure(message)` when given.
 * A superseded request is ignored. The result is true when it worked; `success` is a toast text, or a function of
 * the result that returns the text (null for none).
 */
export function useAttempt() {
  const { toast } = useShell();
  return useCallback(async <T,>(work: () => Promise<T>, success?: Success<T>, failure?: (message: string) => string): Promise<boolean> => {
    try {
      const r = await work();
      const message = typeof success === "function" ? success(r) : success;
      if (message) toast("success", message);
      return true;
    } catch (e) {
      if (!isSuperseded(e)) {
        console.error("Request failed", e);
        toast("error", failure ? failure(errorMessage(e)) : errorMessage(e));
      }
      return false;
    }
  }, [toast]);
}
