/** Small helpers for `heal()` functions: each takes `unknown` and returns a valid value. */

export const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

/** A string cut to `max` characters; anything else becomes `fallback`. */
export function str(x: unknown, max: number, fallback = ""): string {
  return typeof x === "string" ? x.slice(0, max) : fallback;
}

export const bool = (x: unknown, fallback: boolean): boolean => (typeof x === "boolean" ? x : fallback);

/** A real calendar date `YYYY-MM-DD`, or null. */
export function isoDate(x: unknown): string | null {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return null;
  const d = new Date(`${x}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== x ? null : x;
}
