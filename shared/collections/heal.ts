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

/** One line of text: trimmed, inner whitespace (including line breaks) collapsed to one space, cut to `max`. */
export function line(x: unknown, max: number, fallback = ""): string {
  if (typeof x !== "string") return fallback;
  return x.replace(/\s+/g, " ").trim().slice(0, max).trimEnd();
}

/**
 * A list of short strings: non-strings dropped, each item through `line()` (so cut to `maxLen`), empties
 * dropped, duplicates dropped case-insensitively keeping the first spelling, at most `maxItems` kept.
 */
export function strList(x: unknown, maxItems: number, maxLen: number): string[] {
  const out: string[] = [];
  if (!Array.isArray(x)) return out;
  const seen = new Set<string>();
  for (const item of x as unknown[]) {
    if (out.length >= maxItems) break;
    const s = line(item, maxLen);
    const key = s.toLowerCase();
    if (s === "" || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/** `x` when it is one of `values`, else `fallback`. */
export function oneOf<T extends string>(x: unknown, values: readonly T[], fallback: T): T {
  return values.includes(x as T) ? (x as T) : fallback;
}

/** A finite, non-negative number (ms since epoch), or null. */
export const timestamp = (x: unknown): number | null =>
  typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : null;

/** A boolean, or null for anything else (a tri-state "unknown"). */
export const boolOrNull = (x: unknown): boolean | null => (typeof x === "boolean" ? x : null);
