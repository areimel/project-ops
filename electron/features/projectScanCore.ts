// Pure scan decisions (no fs, no electron): what makes a project, what to skip, stack and description detection,
// category hint, and the merge of a scan into the stored records. The file walk is projectScan.ts.
import { isObject } from "../../shared/collections/heal";
import {
  PROJECT_LIMITS, emptyScan, emptySite, overrideText,
  type ProjectFields, type ProjectScan,
} from "../../shared/projects/record";
import type { ProjectRecord } from "../../shared/projects/view";

export const MAX_DEPTH = 4;   // folder levels below the root that are examined

/** Exact file names that make a folder a project; the pattern markers are in `isMarkerName`. */
export const PROJECT_MARKERS: readonly string[] = [
  ".git", "package.json", "Cargo.toml", "pyproject.toml", "requirements.txt", "setup.py", "go.mod",
  "composer.json", "Gemfile", "pom.xml", "build.gradle", "build.gradle.kts", "CMakeLists.txt", "Makefile",
  "deno.json", "deno.jsonc", "pubspec.yaml", "mix.exs",
];

export const SKIP_DIRS: readonly string[] = [
  "node_modules", "vendor", "dist", "build", "out", "target", "venv", ".venv", "__pycache__",
];

const isMarkerName = (n: string): boolean => PROJECT_MARKERS.includes(n) || /\.(sln|csproj)$/i.test(n);

export const isProjectDir = (entryNames: readonly string[]): boolean => entryNames.some(isMarkerName);

/** False for the skip list and every dot-directory. */
export const shouldDescend = (name: string): boolean => !name.startsWith(".") && !SKIP_DIRS.includes(name);

/** Stack ids in table order; a rule fires on a file name test or a package.json dependency. */
const STACK_RULES: { id: string; file?: (n: string) => boolean; dep?: readonly string[] }[] = [
  { id: "node", file: (n) => n === "package.json" },
  { id: "typescript", file: (n) => n === "tsconfig.json", dep: ["typescript"] },
  { id: "react", dep: ["react"] },
  { id: "vue", dep: ["vue"] },
  { id: "svelte", dep: ["svelte"] },
  { id: "astro", dep: ["astro"] },
  { id: "next", dep: ["next"] },
  { id: "electron", dep: ["electron"] },
  { id: "vite", dep: ["vite"] },
  { id: "tauri", file: (n) => n === "tauri.conf.json", dep: ["@tauri-apps/api", "@tauri-apps/cli"] },
  { id: "rust", file: (n) => n === "Cargo.toml" },
  { id: "python", file: (n) => ["pyproject.toml", "requirements.txt", "setup.py"].includes(n) },
  { id: "go", file: (n) => n === "go.mod" },
  { id: "php", file: (n) => n === "composer.json" },
  { id: "ruby", file: (n) => n === "Gemfile" },
  { id: "java", file: (n) => ["pom.xml", "build.gradle", "build.gradle.kts"].includes(n) },
  { id: "dotnet", file: (n) => /\.(sln|csproj)$/i.test(n) },
  { id: "c-cpp", file: (n) => n === "CMakeLists.txt" },
  { id: "dart", file: (n) => n === "pubspec.yaml" },
  { id: "elixir", file: (n) => n === "mix.exs" },
  { id: "deno", file: (n) => n === "deno.json" || n === "deno.jsonc" },
  { id: "docker", file: (n) => /^(dockerfile|(docker-)?compose\.ya?ml)$/i.test(n) },
];

function depNames(packageJson: unknown): Set<string> {
  const out = new Set<string>();
  if (!isObject(packageJson)) return out;
  for (const key of ["dependencies", "devDependencies"]) {
    const d = packageJson[key];
    if (isObject(d)) for (const name of Object.keys(d)) out.add(name);
  }
  return out;
}

/** Stable (table order), deduped, capped at PROJECT_LIMITS.stack. `packageJson` may be any junk. */
export function detectStack(entryNames: readonly string[], packageJson: unknown): string[] {
  const deps = depNames(packageJson);
  const out: string[] = [];
  for (const rule of STACK_RULES) {
    if (entryNames.some((n) => rule.file?.(n)) || rule.dep?.some((d) => deps.has(d))) out.push(rule.id);
  }
  return out.slice(0, PROJECT_LIMITS.stack);
}

/** package.json description when it is a usable string, else null. */
export function detectDescription(packageJson: unknown): string | null {
  return isObject(packageJson) ? overrideText(packageJson.description, PROJECT_LIMITS.description) : null;
}

/** The detected part of a scan (no git, no scannedAt). */
export type DetectedScan = Pick<ProjectScan, "name" | "description" | "stack">;

/**
 * The name is always the folder name (cut to PROJECT_LIMITS.name): the owner organises projects by folder, and
 * cloned templates often share one package.json `name`, which would make their cards indistinguishable.
 */
export function detectScan(dirName: string, entryNames: readonly string[], packageJson: unknown): DetectedScan {
  return {
    name: overrideText(dirName, PROJECT_LIMITS.name),
    description: detectDescription(packageJson),
    stack: detectStack(entryNames, packageJson),
  };
}

export interface FoundProject {
  path: string;            // real path
  rootId: string;
  categoryHint: string;
  scan: DetectedScan;
}

const segments = (p: string): string[] => p.split(/[\\/]+/).filter((s) => s !== "");

/** First segment under the root when the project is nested deeper than one level, else "". Folder name kept as is. */
export function categoryHint(rootPath: string, projectPath: string): string {
  const root = segments(rootPath);
  const proj = segments(projectPath);
  if (proj.length < root.length + 2 || !root.every((s, i) => s === proj[i])) return "";
  return proj[root.length]!;
}

export interface MergeResult {
  next: (ProjectRecord | ProjectFields)[];   // records keep id and timestamps; new ones are bare fields (the store assigns both)
  added: number;
  missing: number;                           // records marked missing by this scan
}

/**
 * Pure merge of one scan into the stored list, for a single `replaceAll`.
 * - Matched by exact path. A match keeps id, timestamps and every user field, gets scan.* refreshed
 *   (git facts in `git` are not touched here: the wiring layer fills them) and missing=false.
 * - A manual record found by a scan stays manual (origin and rootId unchanged).
 * - A hidden (tombstoned) record stays hidden, found or not; its scan is still refreshed.
 * - A new path becomes origin "scan", category = hint, defaults elsewhere. At most PROJECT_LIMITS.max records in
 *   total; extra new ones are dropped.
 * - A found scan-origin record whose rootId is null or not a current root (its root was removed) is re-adopted by the
 *   root that found it, so root counts stay right with overlapping roots. scannedRootIds is every current root.
 * - A scan-origin record whose rootId is in scannedRootIds and whose path was not found gets missing=true; `missing`
 *   counts only visible records newly marked.
 * - Duplicates in `found` (overlapping roots) collapse to the first.
 */
export function mergeScan(
  existing: readonly ProjectRecord[], found: readonly FoundProject[], scannedRootIds: readonly string[], now: number,
): MergeResult {
  const byPath = new Map<string, FoundProject>();
  for (const f of found) if (!byPath.has(f.path)) byPath.set(f.path, f);
  const scanned = new Set(scannedRootIds);
  const seen = new Set<string>();
  let missing = 0;

  const next: (ProjectRecord | ProjectFields)[] = existing.map((rec) => {
    seen.add(rec.path);
    const f = byPath.get(rec.path);
    if (f) {
      const orphan = rec.origin === "scan" && (rec.rootId === null || !scanned.has(rec.rootId));
      return { ...rec, rootId: orphan ? f.rootId : rec.rootId, missing: false, scan: { ...rec.scan, ...f.scan, scannedAt: now } };
    }
    if (rec.origin === "scan" && rec.rootId !== null && scanned.has(rec.rootId)) {
      if (!rec.missing && !rec.hidden) missing++;
      return { ...rec, missing: true };
    }
    return rec;
  });

  let added = 0;
  for (const f of byPath.values()) {
    if (seen.has(f.path) || next.length >= PROJECT_LIMITS.max) continue;
    next.push({
      path: f.path, origin: "scan", rootId: f.rootId, missing: false, hidden: false,
      name: null, description: null, category: f.categoryHint.slice(0, PROJECT_LIMITS.category),
      tags: [], status: "active", pinned: false,
      site: emptySite(),
      links: { repo: null, site: null, docs: null },
      lastOpenedAt: null,
      scan: { ...emptyScan(), ...f.scan, scannedAt: now },
    });
    added++;
  }
  return { next, added, missing };
}
