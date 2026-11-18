import { brand } from "../../shared/brand";
import { isObject } from "../../shared/collections/heal";
import { projectSpec, rootSpec } from "../../shared/projects";
import { healSettingsPatch, type Settings } from "../../shared/settings";

export const BUNDLE_VERSION = 1;

/** Pure. `{ format: brand.packageName, version: 1, exportedAt, settings, collections }`; unknown collections ignored. */
export interface Bundle {
  format: string; version: number; exportedAt: string;
  settings: Settings; collections: Record<string, unknown[]>;
}

/** A bundle as read for import: only what the file actually contains. */
export interface ImportBundle {
  format: string; version: number; exportedAt: string;
  settings: Partial<Settings>; collections: Partial<Record<string, unknown[]>>;
}

/** Names of the collections an export carries and an import accepts. */
export const COLLECTION_NAMES: readonly string[] = [projectSpec.name, rootSpec.name];

/** The part of a Collection the bundle code needs, so tests can pass in-memory ones. */
export interface BundleCollection {
  list(): unknown[];
  replaceAll(items: unknown): void;
  clear(): void;
}

/** Full stored records of every collection (paths and tombstones included: it is the owner's own backup). */
export function exportCollections(targets: Record<string, BundleCollection>): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {};
  for (const [name, c] of Object.entries(targets)) out[name] = c.list();
  return out;
}

/**
 * Replaces only the collections the bundle contains, then runs `andThen` (the settings update); returns how many
 * records each collection now holds (after healing). Every target the file touches is read first and its list kept,
 * so one from a newer version (list() throws) refuses the whole import before anything is replaced. When a later
 * write or `andThen` fails, the collections already replaced are put back from those lists and the error is
 * rethrown, so a failed import leaves the data as it was (as far as the put-back writes succeed). Nothing is
 * stat'ed or opened: paths are only data.
 */
export function applyCollections(
  bundle: ImportBundle, targets: Record<string, BundleCollection>, andThen: () => void = () => undefined,
): Record<string, number> {
  const todo = Object.entries(bundle.collections).filter((e): e is [string, unknown[]] => Array.isArray(e[1]) && Object.hasOwn(targets, e[0]));
  const before = todo.map(([name]) => [name, targets[name].list()] as const);
  const replaced: string[] = [];
  const counts: Record<string, number> = {};
  try {
    for (const [name, items] of todo) {
      targets[name].replaceAll(items);
      replaced.push(name);
      counts[name] = targets[name].list().length;
    }
    andThen();
  } catch (e) {
    for (const [name, items] of before) {
      if (!replaced.includes(name)) continue;
      try { targets[name].replaceAll(items); } catch { /* the original error is the one to report */ }
    }
    throw e;
  }
  return counts;
}

/** Reset: every collection emptied (also a damaged or newer file). */
export function clearCollections(targets: Record<string, BundleCollection>): void {
  for (const c of Object.values(targets)) c.clear();
}

export function buildBundle(settings: Settings, collections: Record<string, unknown[]>, now: Date = new Date()): Bundle {
  return { format: brand.packageName, version: BUNDLE_VERSION, exportedAt: now.toISOString(), settings, collections };
}

/**
 * Checks the envelope only; items are healed per collection when they are imported (`replaceAll`).
 * Only the collections in `names` that are present as lists are returned, and settings are a patch of the valid keys,
 * so importing a partial file leaves everything else as it is. Null when it is not one of our bundles or
 * comes from a newer version.
 */
export function healBundle(raw: unknown, names: readonly string[] = COLLECTION_NAMES): ImportBundle | null {
  if (!isObject(raw) || raw.format !== brand.packageName) return null;
  if (typeof raw.version !== "number" || !Number.isInteger(raw.version) || raw.version < 1 || raw.version > BUNDLE_VERSION) return null;
  const src = isObject(raw.collections) ? raw.collections : {};
  const collections: Partial<Record<string, unknown[]>> = {};
  for (const name of names) {
    const items = Object.hasOwn(src, name) ? src[name] : undefined;
    if (Array.isArray(items)) collections[name] = items;
  }
  return {
    format: raw.format, version: raw.version,
    exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt.slice(0, 64) : "",
    settings: healSettingsPatch(raw.settings),
    collections,
  };
}
