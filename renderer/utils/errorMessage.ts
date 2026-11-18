/** The message of a caught value: an Error's message, else the value as text. */
export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
