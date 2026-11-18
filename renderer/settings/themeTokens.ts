import { contrastRatio, isHex } from "../theme/color";

/** Pure helpers for the Appearance section: reading a typed hex colour, and checking an accent. */

/** "#3366CC", "3366cc" and "#36c" all give "#3366cc"; anything else gives null. */
export function normalizeHex(input: string): string | null {
  const t = input.trim().replace(/^#/, "");
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(t)) return null;
  const full = t.length === 3 ? [...t].map((c) => c + c).join("") : t;
  return `#${full.toLowerCase()}`;
}

export const MIN_ACCENT_CONTRAST = 4.5;

/** True when the accent would be hard to read as text on the surface. False when either colour is not a hex. */
export function accentIsHardToRead(accent: string, surface: string): boolean {
  return isHex(accent) && isHex(surface) && contrastRatio(accent, surface) < MIN_ACCENT_CONTRAST;
}
