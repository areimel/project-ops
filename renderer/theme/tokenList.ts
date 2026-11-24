// Every design token by name (no leading "--"), grouped as tokens.css and the theme files declare them.
// tests/theme.test.ts checks this list against the CSS in both directions, so a token is added here and in CSS together.

/** The 12 colour tokens every theme sets for light and dark (themes/*.css). */
export const BASE_TOKENS = [
  "bg", "surface", "surface-raised", "text", "text-muted", "line", "accent", "accent-text", "accent-ink",
  "danger", "danger-ink", "success",
] as const;

/** Colours derived from the base tokens (tokens.css), so they follow the theme and the accent override. */
export const DERIVED_TOKENS = [
  "hover", "pressed", "selected", "scrim", "grid", "control-border", "focus", "glitch-a", "glitch-b",
] as const;

export const FONT_SIZES = ["fs-xs", "fs-sm", "fs-md", "fs-lg", "fs-xl", "fs-2xl", "fs-3xl", "fs-display"] as const;
export const FONT_WEIGHTS = ["fw-regular", "fw-medium", "fw-bold", "fw-heavy"] as const;
export const SPACES = ["sp-1", "sp-2", "sp-3", "sp-4", "sp-5", "sp-6", "sp-7"] as const;

/** Everything else: faces, line heights, tracking, the label look, shape, layers, motion, shell sizes, shadow. */
export const OTHER_TOKENS = [
  "font-text", "font-display", "font-mono",
  "lh-tight", "lh-body", "track-heading",
  "label-font", "label-size", "label-weight", "label-track",
  "r", "r-pill", "hazard-w", "line-w", "focus-w", "focus-offset", "control-h", "bullet", "select-bar",
  "z-base", "z-chrome", "z-popover", "z-dialog", "z-toast",
  "dur-fast", "dur", "dur-glitch", "ease",
  "titlebar-h", "footer-h",
  "shadow-float",
] as const;

export const ALL_TOKENS: readonly string[] = [
  ...BASE_TOKENS, ...DERIVED_TOKENS, ...FONT_SIZES, ...FONT_WEIGHTS, ...SPACES, ...OTHER_TOKENS,
];
