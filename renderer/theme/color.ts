/** Pure colour helpers: WCAG contrast and readable ink. Hex only (`#rgb` or `#rrggbb`). */

export type Rgb = [number, number, number];

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isHex = (s: unknown): s is string => typeof s === "string" && HEX.test(s);

export function hexToRgb(hex: string): Rgb {
  if (!isHex(hex)) throw new Error(`not a hex colour: ${String(hex)}`);
  const h = hex.length === 4 ? [...hex.slice(1)].map((c) => c + c).join("") : hex.slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

export function rgbToHex([r, g, b]: Rgb): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

/** WCAG 2.x relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 to 21, symmetric in its arguments. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const LIGHT_INK = "#ffffff";
const DARK_INK = "#10161f";

/** Text colour for use on top of `hex`: whichever of white and the dark ink has more contrast. */
export function inkFor(hex: string): string {
  return contrastRatio(hex, LIGHT_INK) >= contrastRatio(hex, DARK_INK) ? LIGHT_INK : DARK_INK;
}

/** Linear mix in sRGB: `t` 0 gives `a`, 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const [x, y] = [hexToRgb(a), hexToRgb(b)];
  return rgbToHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as Rgb);
}

/**
 * `fg` nudged toward `toward` (the page's text colour) until it reaches `min` contrast on `bg`.
 * Returns `fg` itself when it already passes, and the closest it could get otherwise.
 */
export function ensureContrast(fg: string, bg: string, toward: string, min = 4.5): string {
  if (contrastRatio(fg, bg) >= min) return fg;
  let best = fg;
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    best = mix(fg, toward, t);
    if (contrastRatio(best, bg) >= min) return best;
  }
  return best;
}
