// Runs a scan of every root: walk, git, one replaceAll. One scan at a time by counter: a newer scan (or a root
// being removed, or shutdown) supersedes the running one, which then throws supersededError() at its next check
// and never touches the store. The merge happens synchronously after the last await, against the store as it
// is then, so an edit made while git was running is never overwritten by a stale list.
import { stat } from "node:fs/promises";
import type { ScanResult } from "../../shared/ipc/projects";
import { isSuperseded, supersededError } from "../../shared/superseded";
import { emit } from "../ipc/handle";
import { projectsStore, rootsStore } from "../store/projects";
import { readGitInfos } from "./gitInfo";
import { log } from "./logger";
import { scanRoot } from "./projectScan";
import { mergeScan, type FoundProject } from "./projectScanCore";
import { finishScan, gitTargets, statTargets, visibleCount, zipMap } from "./projectsCore";

let latest = 0;
let active = false;   // a current scan is in flight (the page has been told scanning: true)

function setScanning(scanning: boolean): void {
  active = scanning;
  emit("projects:scan-state", { scanning });
}

/** Supersedes a running scan (it stops at its next check); tells the page scanning stopped. */
export function invalidateScan(): void {
  latest++;
  if (active) setScanning(false);
}

const isDir = (path: string): Promise<boolean> => stat(path).then((s) => s.isDirectory(), () => false);

export async function scan(): Promise<ScanResult> {
  const mine = ++latest;
  const isCurrent = (): boolean => mine === latest;
  const check = (): void => { if (!isCurrent()) throw supersededError(); };
  setScanning(true);
  try {
    const roots = rootsStore().list();
    const found: FoundProject[] = [];
    for (const root of roots) {
      try {
        found.push(...await scanRoot(root, isCurrent));
      } catch (e) {
        if (isSuperseded(e)) throw e;
        // A root that is gone (unmounted, deleted) is skipped; it stays in scannedRootIds below, so mergeScan
        // marks its projects missing rather than leaving them looking present.
        log.warn("projects", `Scan root ${root.id} could not be read (${(e as NodeJS.ErrnoException).code ?? "error"}); its projects are marked missing`);
      }
      check();
    }
    const scannedRootIds = roots.map((r) => r.id);
    const before = projectsStore().list();
    const gitPaths = gitTargets(found, before);
    const statPaths = statTargets(before, found, scannedRootIds);
    const infos = await readGitInfos(gitPaths);
    check();
    const present = await Promise.all(statPaths.map(isDir));
    check();

    // From here to replaceAll there is no await.
    const store = projectsStore();
    const now = Date.now();
    const merged = mergeScan(store.list(), found, scannedRootIds, now);
    const done = finishScan(merged.next, zipMap(gitPaths, infos), zipMap(statPaths, present), now);
    store.replaceAll(done.next);
    const result = { added: merged.added, missing: merged.missing + done.newlyMissing, total: visibleCount(store.list()) };
    log.info("projects", `Scan done: ${roots.length} roots, ${found.length} found, ${result.added} added, ${result.missing} missing`);
    return result;
  } finally {
    if (isCurrent()) setScanning(false);
  }
}

/** Starts a scan without waiting (after a root is added); a superseded run is ignored, a failure logged. */
export function scanInBackground(): void {
  scan().catch((e) => { if (!isSuperseded(e)) log.error("projects", "Scan failed", e); });
}
