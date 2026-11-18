// Pure helpers (no React, no DOM) so they can be unit-tested in node.

const UNITS: [name: string, seconds: number][] = [
  ["year", 365 * 86400], ["month", 30 * 86400], ["week", 7 * 86400], ["day", 86400], ["hour", 3600], ["minute", 60],
];

/** "3 hours ago". `sec` is a Unix time in seconds (what the API sends), `now` is in milliseconds. */
export function relativeTime(sec: number, now: number): string {
  const diff = Math.floor(now / 1000 - sec);
  if (!Number.isFinite(diff) || diff < 60) return "just now";   // also covers clock skew (a story from "the future")
  for (const [name, size] of UNITS) {
    if (diff >= size) {
      const n = Math.floor(diff / size);
      return `${n} ${name}${n === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}

export const plural = (n: number, word: string, many = `${word}s`): string => `${n} ${n === 1 ? word : many}`;

/** "10:42" in the user's locale and clock style. */
export function clockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
