import { brand } from "../../shared/brand";
import { COLLECTIONS, type CollectionName } from "../../shared/collections";
import { isObject } from "../../shared/collections/heal";
import { healSettingsPatch, type Settings } from "../../shared/settings";

export const BUNDLE_VERSION = 1;

/** Pure. `{ format: brand.packageName, version: 1, exportedAt, settings, collections }`; unknown collections ignored. */
export interface Bundle {
  format: string; version: number; exportedAt: string;
  settings: Settings; collections: Record<CollectionName, unknown[]>;
}

/** A bundle as read for import: only what the file actually contains. */
export interface ImportBundle {
  format: string; version: number; exportedAt: string;
  settings: Partial<Settings>; collections: Partial<Record<CollectionName, unknown[]>>;
}

const names = Object.keys(COLLECTIONS) as CollectionName[];

export function buildBundle(settings: Settings, collections: Record<CollectionName, unknown[]>, now: Date = new Date()): Bundle {
  return { format: brand.packageName, version: BUNDLE_VERSION, exportedAt: now.toISOString(), settings, collections };
}

/**
 * Checks the envelope only; items are healed per collection when they are imported (`replaceAll`).
 * Only the collections that are present as lists are returned, and settings are a patch of the valid keys,
 * so importing a partial file leaves everything else as it is. Null when it is not one of our bundles or
 * comes from a newer version.
 */
export function healBundle(raw: unknown): ImportBundle | null {
  if (!isObject(raw) || raw.format !== brand.packageName) return null;
  if (typeof raw.version !== "number" || !Number.isInteger(raw.version) || raw.version < 1 || raw.version > BUNDLE_VERSION) return null;
  const src = isObject(raw.collections) ? raw.collections : {};
  const collections: Partial<Record<CollectionName, unknown[]>> = {};
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
