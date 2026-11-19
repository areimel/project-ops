import { describe, expect, it } from "vitest";
import { emptyScan, type ProjectFields } from "../../shared/projects/record";
import type { ProjectRecord } from "../../shared/projects/view";
import type { GitInfo } from "../../electron/features/gitInfoCore";
import { mergeScan, type FoundProject } from "../../electron/features/projectScanCore";
import {
  afterRootRemoved, countByRoot, finishScan, gitTargets, newManualProject, scanFacts, statTargets, toRootViews,
  visibleCount, zipMap,
} from "../../electron/features/projectsCore";

const R1 = "1111111111111111";
const R2 = "2222222222222222";

let n = 0;
function rec(over: Partial<ProjectFields> = {}): ProjectRecord {
  n++;
  return {
    id: n.toString(16).padStart(16, "0"), createdAt: 1, updatedAt: 1,
    path: `/p/${n}`, origin: "scan", rootId: R1, missing: false, hidden: false,
    name: null, description: null, category: "", tags: [], status: "active", pinned: false,
    links: { repo: null, site: null, docs: null }, lastOpenedAt: null, scan: emptyScan(), ...over,
  };
}
const found = (path: string, rootId = R1): FoundProject => ({ path, rootId, categoryHint: "", scan: { name: "x", description: null, stack: [] } });
const git: GitInfo = { branch: "main", lastCommitAt: 5000, dirty: false, repoUrl: "https://h.example/u/r" };
const noGit: GitInfo = { branch: null, lastCommitAt: null, dirty: null, repoUrl: null };

describe("countByRoot and toRootViews", () => {
  it("counts visible projects per root, zero for an empty root", () => {
    const projects = [rec(), rec(), rec({ hidden: true }), rec({ rootId: R2 }), rec({ rootId: null, origin: "manual" })];
    expect(countByRoot(projects)).toEqual(new Map([[R1, 2], [R2, 1]]));
    const roots = [{ id: R1, createdAt: 1, updatedAt: 1, path: "/r1" }, { id: "3333333333333333", createdAt: 1, updatedAt: 1, path: "/r3" }];
    expect(toRootViews(roots, projects, (p) => `D${p}`)).toEqual([
      { id: R1, folder: "D/r1", projectCount: 2 },
      { id: "3333333333333333", folder: "D/r3", projectCount: 0 },
    ]);
  });
  it("visibleCount leaves hidden records out", () => {
    expect(visibleCount([rec(), rec({ hidden: true })])).toBe(1);
  });
});

describe("afterRootRemoved", () => {
  it("keeps the root's projects and tombstones with rootId null, leaves others alone", () => {
    const keep = rec();
    const tomb = rec({ hidden: true });
    const other = rec({ rootId: R2 });
    const otherTomb = rec({ rootId: R2, hidden: true });
    const out = afterRootRemoved([keep, tomb, other, otherTomb], R1, 99);
    expect(out).toEqual([{ ...keep, rootId: null, updatedAt: 99 }, { ...tomb, rootId: null, updatedAt: 99 }, other, otherTomb]);
  });
});

describe("nested roots (A contains B)", () => {
  const A = R1;
  const B = R2;
  it("a project removed by the user stays hidden after A goes and B is scanned", () => {
    const p = rec({ path: "/a/b/p", rootId: A, hidden: true });
    const afterRemove = afterRootRemoved([p], A, 50);
    const merged = mergeScan(afterRemove, [found("/a/b/p", B)], [B], 60);
    expect(merged.next).toHaveLength(1);
    expect(merged.next[0]).toMatchObject({ path: "/a/b/p", hidden: true, rootId: B });
    expect(merged.added).toBe(0);
    expect(countByRoot(merged.next)).toEqual(new Map());
  });
  it("B adopts A's projects it also covers, so the root counts stay right", () => {
    const q = rec({ path: "/a/b/q", rootId: A });
    const onlyA = rec({ path: "/a/x", rootId: A });
    const merged = mergeScan(afterRootRemoved([q, onlyA], A, 50), [found("/a/b/q", B)], [B], 60);
    expect(merged.next.map((r) => r.rootId)).toEqual([B, null]);
    expect(countByRoot(merged.next)).toEqual(new Map([[B, 1]]));
  });
  it("a record of a current root keeps its root when another current root finds it too", () => {
    const q = rec({ path: "/a/b/q", rootId: A });
    const merged = mergeScan([q], [found("/a/b/q", B)], [A, B], 60);
    expect(merged.next[0]).toMatchObject({ rootId: A });
  });
  it("a manual record is never adopted", () => {
    const m = rec({ path: "/a/b/m", origin: "manual", rootId: null });
    expect(mergeScan([m], [found("/a/b/m", B)], [B], 60).next[0]).toMatchObject({ origin: "manual", rootId: null });
  });
});

describe("scanFacts and newManualProject", () => {
  it("replaces detected and git facts and stamps scannedAt", () => {
    const prev = { ...emptyScan(), name: "old", stack: ["go"], branch: "x", dirty: true };
    expect(scanFacts(prev, { name: "new", description: "d", stack: ["node"] }, git, 7)).toEqual({
      name: "new", description: "d", stack: ["node"], branch: "main", lastCommitAt: 5000, dirty: false,
      repoUrl: "https://h.example/u/r", scannedAt: 7,
    });
  });
  it("keeps detected facts when the folder read failed", () => {
    const prev = { ...emptyScan(), name: "old", stack: ["go"] };
    expect(scanFacts(prev, null, noGit, 7)).toMatchObject({ name: "old", stack: ["go"], branch: null, scannedAt: 7 });
  });
  it("a manual record has no root and default user fields", () => {
    const p = newManualProject("/m", { name: "m", description: null, stack: [] }, noGit, 3);
    expect(p).toMatchObject({ path: "/m", origin: "manual", rootId: null, hidden: false, missing: false, category: "", status: "active" });
    expect(p.scan.scannedAt).toBe(3);
  });
});

describe("gitTargets", () => {
  it("dedupes found paths and leaves out hidden records", () => {
    const hidden = rec({ hidden: true, path: "/h" });
    expect(gitTargets([found("/a"), found("/h"), found("/a", R2), found("/b")], [hidden])).toEqual(["/a", "/b"]);
  });
});

describe("statTargets", () => {
  it("re-checks manual and orphaned records that were not found, not ones the merge settles", () => {
    const manual = rec({ origin: "manual", rootId: null, path: "/m" });
    const manualFound = rec({ origin: "manual", rootId: null, path: "/mf" });
    const orphan = rec({ rootId: null, path: "/o" });
    const underRoot = rec({ path: "/u" });
    const hiddenManual = rec({ origin: "manual", rootId: null, hidden: true, path: "/hm" });
    const unscannedRoot = rec({ rootId: R2, path: "/r2" });
    expect(statTargets([manual, manualFound, orphan, underRoot, hiddenManual, unscannedRoot], [found("/mf")], [R1]))
      .toEqual(["/m", "/o", "/r2"]);
  });
});

describe("finishScan", () => {
  it("fills git facts by path and leaves other fields alone", () => {
    const a = rec({ path: "/a", scan: { ...emptyScan(), name: "a", stack: ["node"] } });
    const { next, newlyMissing } = finishScan([a], zipMap(["/a"], [git]), new Map(), 9);
    expect(next[0]!.scan).toEqual({ ...a.scan, branch: "main", lastCommitAt: 5000, dirty: false, repoUrl: "https://h.example/u/r", scannedAt: 9 });
    expect(next[0]!.id).toBe(a.id);
    expect(newlyMissing).toBe(0);
  });
  it("sets missing from the existence check and counts only new ones", () => {
    const gone = rec({ path: "/g" });
    const stillGone = rec({ path: "/s", missing: true });
    const back = rec({ path: "/b", missing: true });
    const untouched = rec({ path: "/u", missing: true });
    const { next, newlyMissing } = finishScan(
      [gone, stillGone, back, untouched], new Map(), zipMap(["/g", "/s", "/b"], [false, false, true]), 9);
    expect(next.map((r) => r.missing)).toEqual([true, true, false, true]);
    expect(next[1]).toBe(stillGone);
    expect(next[3]).toBe(untouched);
    expect(newlyMissing).toBe(1);
  });
});
