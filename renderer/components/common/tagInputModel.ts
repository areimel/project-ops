/** Pure rules for the tag input: normalising, adding, filtering suggestions and what a key press means. */

export interface TagLimits {
  /** Most tags allowed in total. */
  max?: number;
  /** Longest tag in characters; longer text is cut. */
  maxLength?: number;
}

/** Trim, collapse inner whitespace, cut to `maxLength`. Empty string means "not a tag". */
export function normalizeTag(raw: string, maxLength?: number): string {
  const t = raw.replace(/\s+/g, " ").trim();
  return maxLength !== undefined && maxLength > 0 ? t.slice(0, maxLength).trim() : t;
}

/** Add the tags in `raw` (comma or line separated) to `current`. Duplicates (any case) keep the first spelling. */
export function addTags(current: readonly string[], raw: string, limits: TagLimits = {}): string[] {
  const out = [...current];
  const seen = new Set(out.map((t) => t.toLowerCase()));
  for (const part of raw.split(/[,\n\r]/)) {
    if (limits.max !== undefined && out.length >= limits.max) break;
    const tag = normalizeTag(part, limits.maxLength);
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push(tag);
  }
  return out;
}

export function removeAt<T>(list: readonly T[], index: number): T[] {
  return index < 0 || index >= list.length ? [...list] : list.filter((_, i) => i !== index);
}

/** Suggestions that contain `typed` (any case), minus the ones already chosen; prefix matches first. */
export function filterSuggestions(suggestions: readonly string[], current: readonly string[], typed: string, limit = 8): string[] {
  const q = typed.trim().toLowerCase();
  const taken = new Set(current.map((t) => t.toLowerCase()));
  const seen = new Set<string>();
  const hits: { s: string; rank: number }[] = [];
  for (const s of suggestions) {
    const k = s.toLowerCase();
    if (!s.trim() || taken.has(k) || seen.has(k)) continue;
    seen.add(k);
    const at = k.indexOf(q);
    if (at >= 0) hits.push({ s, rank: at === 0 ? 0 : 1 });
  }
  return hits.sort((a, b) => a.rank - b.rank).slice(0, limit).map((h) => h.s);
}

export interface KeyState {
  key: string;
  /** Text in the input now. */
  input: string;
  /** Is the suggestion list showing. */
  open: boolean;
  /** Highlighted suggestion, -1 for none. */
  active: number;
  /** Number of suggestions in the list. */
  count: number;
  tagCount: number;
  /** An input method editor is composing text; leave every key alone. */
  composing?: boolean;
}

export type KeyAction =
  | { type: "none" }
  | { type: "add" }
  | { type: "pick"; index: number }
  | { type: "removeLast" }
  | { type: "move"; to: number }
  | { type: "close" };

/** What a key press does. Anything but `none` should also have its default prevented. */
export function decideKey(s: KeyState): KeyAction {
  if (s.composing) return { type: "none" };
  const listed = s.open && s.count > 0;
  switch (s.key) {
    case "Enter":
      if (listed && s.active >= 0 && s.active < s.count) return { type: "pick", index: s.active };
      return s.input.trim() ? { type: "add" } : { type: "none" };
    case ",":
      return { type: "add" };
    case "Backspace":
      return s.input === "" && s.tagCount > 0 ? { type: "removeLast" } : { type: "none" };
    case "ArrowDown":
      return s.count > 0 ? { type: "move", to: listed ? (s.active + 1) % s.count : 0 } : { type: "none" };
    case "ArrowUp":
      if (!listed) return { type: "none" };
      return { type: "move", to: s.active <= 0 ? s.count - 1 : s.active - 1 };
    case "Escape":
      return listed ? { type: "close" } : { type: "none" };
    default:
      return { type: "none" };
  }
}
