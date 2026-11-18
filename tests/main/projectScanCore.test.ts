import { describe, expect, it } from "vitest";
import { emptyScan, type ProjectFields } from "../../shared/projects/record";
import type { ProjectRecord } from "../../shared/projects/view";
import {
  MAX_DEPTH, categoryHint, detectMeta, detectScan, detectStack, isProjectDir, mergeScan, shouldDescend,
  type FoundProject,
} from "../../electron/features/projectScanCore";

describe("isProjectDir", () => {
  it("accepts markers", () => {
    for (const m of [".git", "package.json", "Cargo.toml", "go.mod", "Makefile", "pubspec.yaml", "mix.exs", "App.sln", "x.csproj"]) {
      expect(isProjectDir(["readme.md", m])).toBe(true);
    }
  });
  it("rejects plain folders", () => {
    expect(isProjectDir([])).toBe(false);
    expect(isProjectDir(["src", "README.md", "package.json.bak"])).toBe(false);
  });
});

describe("shouldDescend", () => {
  it("skips the list and dot-directories", () => {
    for (const n of ["node_modules", "vendor", "dist", "build", "out", "target", "venv", ".venv", "__pycache__", ".cache", ".git"]) {
      expect(shouldDescend(n)).toBe(false);
    }
    expect(shouldDescend("src")).toBe(true);
    expect(MAX_DEPTH).toBe(4);
  });
});

describe("detectStack", () => {
  it("reads marker files", () => {
    expect(detectStack(["Cargo.toml", "Dockerfile"], null)).toEqual(["rust", "docker"]);
    expect(detectStack(["go.mod", "App.csproj", "CMakeLists.txt", "Gemfile", "composer.json", "pom.xml"], undefined))
      .toEqual(["go", "php", "ruby", "java", "dotnet", "c-cpp"]);
    expect(detectStack(["docker-compose.yml"], null)).toEqual(["docker"]);
    expect(detectStack(["requirements.txt", "pubspec.yaml", "mix.exs", "deno.json"], null))
      .toEqual(["python", "dart", "elixir", "deno"]);
  });
  it("reads package.json dependencies and devDependencies, stable and deduped", () => {
    const pkg = { dependencies: { react: "1", electron: "1" }, devDependencies: { typescript: "5", vite: "1", react: "1" } };
    expect(detectStack(["package.json", "tsconfig.json"], pkg)).toEqual(["node", "typescript", "react", "electron", "vite"]);
  });
  it("tolerates junk shapes", () => {
    for (const junk of [1, "x", [], { dependencies: "react" }, { dependencies: null }, { devDependencies: [1] }]) {
      expect(detectStack(["package.json"], junk)).toEqual(["node"]);
    }
  });
});

describe("detectMeta / detectScan", () => {
  it("takes sane strings only", () => {
    expect(detectMeta("d", { name: "my-app", description: "Does things" })).toEqual({ name: "my-app", description: "Does things" });
    expect(detectMeta("d", { name: 5, description: "" })).toEqual({ name: null, description: null });
    expect(detectMeta("d", [])).toEqual({ name: null, description: null });
  });
  it("falls back to the folder name", () => {
    expect(detectScan("folder", ["Cargo.toml"], null)).toEqual({ name: "folder", description: null, stack: ["rust"] });
    expect(detectScan("folder", [], { name: "pkg" }).name).toBe("pkg");
  });
});

describe("categoryHint", () => {
  it("is the first segment under the root when nested deeper", () => {
    expect(categoryHint("/home/a/code_projects", "/home/a/code_projects/desktop-app-projects/project-ops")).toBe("desktop-app-projects");
    expect(categoryHint("/r/", "/r/a/b/c")).toBe("a");
  });
  it("is empty directly under the root or outside it", () => {
    expect(categoryHint("/r", "/r/app")).toBe("");
    expect(categoryHint("/r", "/other/a/b")).toBe("");
    expect(categoryHint("/r", "/r")).toBe("");
  });
  it("handles Windows separators", () => {
    expect(categoryHint("C:\\code", "C:\\code\\work\\app")).toBe("work");
  });
});

const rec = (over: Partial<ProjectFields> & { path: string }, id = "0123456789abcdef"): ProjectRecord => ({
  id, createdAt: 10, updatedAt: 20,
  origin: "scan", rootId: "r1", missing: false, hidden: false, name: null, description: null, category: "",
  tags: [], status: "active", pinned: false, links: { repo: null, site: null, docs: null }, scan: emptyScan(),
  ...over,
});
const found = (path: string, over: Partial<FoundProject> = {}): FoundProject => ({
  path, rootId: "r1", categoryHint: "", scan: { name: "n", description: "d", stack: ["node"] }, ...over,
});

describe("mergeScan", () => {
  it("adds new paths with defaults and the category hint", () => {
    const r = mergeScan([], [found("/r/g/a", { categoryHint: "g" })], ["r1"], 500);
    expect(r.added).toBe(1);
    expect(r.next[0]).toMatchObject({
      path: "/r/g/a", origin: "scan", rootId: "r1", category: "g", hidden: false, missing: false, status: "active",
      scan: { name: "n", stack: ["node"], scannedAt: 500, branch: null },
    });
    expect("id" in r.next[0]!).toBe(false);
  });
  it("keeps id, timestamps and all user fields of a match and refreshes scan", () => {
    const user = {
      path: "/r/a", name: "Mine", description: "mine", category: "c", tags: ["t"], status: "paused" as const, pinned: true,
      links: { repo: "https://x.io/a", site: null, docs: null }, missing: true,
      scan: { ...emptyScan(), branch: "main", dirty: true },
    };
    const r = mergeScan([rec(user)], [found("/r/a", { categoryHint: "zzz" })], ["r1"], 900);
    expect(r.added).toBe(0);
    expect(r.next[0]).toMatchObject({
      ...user, id: "0123456789abcdef", createdAt: 10, updatedAt: 20, missing: false, category: "c",
      scan: { name: "n", description: "d", stack: ["node"], scannedAt: 900, branch: "main", dirty: true },
    });
  });
  it("marks unfound scan records of scanned roots missing, not removed", () => {
    const r = mergeScan([rec({ path: "/r/gone" })], [], ["r1"], 1);
    expect(r.next).toHaveLength(1);
    expect(r.next[0]).toMatchObject({ missing: true });
    expect(r.missing).toBe(1);
  });
  it("leaves records of other roots and manual records alone", () => {
    const other = rec({ path: "/o/x", rootId: "r2" }, "1111111111111111");
    const manual = rec({ path: "/m/x", origin: "manual", rootId: null }, "2222222222222222");
    const r = mergeScan([other, manual], [], ["r1"], 1);
    expect(r.next).toEqual([other, manual]);
    expect(r.missing).toBe(0);
  });
  it("keeps a manual record manual when a scan finds its path", () => {
    const manual = rec({ path: "/r/m", origin: "manual", rootId: null });
    const r = mergeScan([manual], [found("/r/m")], ["r1"], 1);
    expect(r.added).toBe(0);
    expect(r.next).toHaveLength(1);
    expect(r.next[0]).toMatchObject({ origin: "manual", rootId: null, missing: false, scan: { stack: ["node"] } });
  });
  it("keeps hidden records hidden, found or not", () => {
    const hid = rec({ path: "/r/h", hidden: true });
    const hidGone = rec({ path: "/r/g", hidden: true }, "3333333333333333");
    const r = mergeScan([hid, hidGone], [found("/r/h")], ["r1"], 1);
    expect(r.next.map((x) => x.hidden)).toEqual([true, true]);
    expect(r.added).toBe(0);
  });
  it("collapses duplicates from overlapping roots", () => {
    const r = mergeScan([], [found("/r/a"), found("/r/a", { rootId: "r2" })], ["r1", "r2"], 1);
    expect(r.added).toBe(1);
    expect(r.next).toHaveLength(1);
    expect(r.next[0]).toMatchObject({ rootId: "r1" });
  });
  it("does not count an already-missing record again", () => {
    expect(mergeScan([rec({ path: "/r/g", missing: true })], [], ["r1"], 1).missing).toBe(0);
  });
});
