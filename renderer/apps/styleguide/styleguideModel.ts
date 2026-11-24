// Pure logic of the styleguide: entry checks and order, the index rail, mode frames, scroll spy, contrast table.
import type { ResolvedMode } from "../../../shared/theme";
import { contrastRatio, isHex } from "../../theme/color";
import type { CatalogueEntry, Family } from "./types";

export const FAMILIES: { id: Family; title: string }[] = [
  { id: "foundations", title: "Foundations" },
  { id: "actions", title: "Actions" },
  { id: "inputs", title: "Inputs" },
  { id: "display", title: "Display" },
  { id: "feedback", title: "Feedback" },
  { id: "overlays", title: "Overlays" },
  { id: "layout", title: "Layout" },
  { id: "patterns", title: "Patterns" },
];

const ID = /^[a-z][a-z0-9-]*$/;

/** Checks every module of the entries folder and returns its entries in catalogue order. Throws, naming the file. */
export function collectEntries(mods: Record<string, { entry?: unknown }>): CatalogueEntry[] {
  const seen = new Map<string, string>();
  const out: CatalogueEntry[] = [];
  for (const [file, mod] of Object.entries(mods)) {
    const e = mod.entry as CatalogueEntry | undefined;
    if (!e || typeof e !== "object") throw new Error(`${file}: no exported "entry"`);
    if (typeof e.id !== "string" || !ID.test(e.id)) throw new Error(`${file}: entry id "${String(e.id)}" must match ${ID}`);
    const first = seen.get(e.id);
    if (first) throw new Error(`${file}: duplicate entry id "${e.id}" (also in ${first})`);
    seen.set(e.id, file);
    if (!FAMILIES.some((f) => f.id === e.family)) throw new Error(`${file}: unknown family "${String(e.family)}"`);
    if (!Array.isArray(e.specimens) || e.specimens.length === 0) throw new Error(`${file}: entry "${e.id}" has no specimens`);
    out.push(e);
  }
  const rank = (e: CatalogueEntry) => FAMILIES.findIndex((f) => f.id === e.family);
  return out.sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
}

export interface RailGroup { id: Family; title: string; entries: CatalogueEntry[] }

/** Entries grouped by family in family order; families with no entries are left out. */
export function railGroups(entries: readonly CatalogueEntry[]): RailGroup[] {
  return FAMILIES
    .map((f) => ({ ...f, entries: entries.filter((e) => e.family === f.id) }))
    .filter((g) => g.entries.length > 0);
}

export const anchorId = (id: string) => `styleguide-${id}`;

export type ModeChoice = "dark" | "light" | "both";

export function framesFor(choice: ModeChoice): ResolvedMode[] {
  return choice === "both" ? ["dark", "light"] : [choice];
}

/** The sheet the reader is on: the last one whose top has reached `offset`, else the first. */
export function activeEntry(tops: readonly { id: string; top: number }[], offset: number): string | null {
  if (tops.length === 0) return null;
  let current = tops[0].id;
  for (const t of tops) if (t.top <= offset) current = t.id;
  return current;
}

export type ContrastGrade = "AAA" | "AA" | "AA large" | "Fail";

export function contrastGrade(ratio: number): ContrastGrade {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA large";
  return "Fail";
}

const PAIRS: [string, string][] = [
  ["text", "bg"], ["text", "surface"], ["text", "surface-raised"],
  ["text-muted", "bg"], ["text-muted", "surface"],
  ["accent-text", "bg"], ["accent-text", "surface"], ["accent-ink", "accent"],
  ["danger", "surface"], ["danger-ink", "danger"], ["success", "surface"],
];

export interface ContrastPair { fg: string; bg: string; ratio: number; grade: ContrastGrade }

/** The text-on-background pairs the interface relies on; pairs whose values are not hex are skipped. */
export function contrastPairs(palette: Record<string, string>): ContrastPair[] {
  const out: ContrastPair[] = [];
  for (const [fg, bg] of PAIRS) {
    const [a, b] = [palette[fg], palette[bg]];
    if (!isHex(a) || !isHex(b)) continue;
    const ratio = contrastRatio(a, b);
    out.push({ fg, bg, ratio, grade: contrastGrade(ratio) });
  }
  return out;
}

/** Sheet number in catalogue order, 0-based index in, "SG-07" out. */
export const sheetSerial = (index: number) => `SG-${String(index + 1).padStart(2, "0")}`;
