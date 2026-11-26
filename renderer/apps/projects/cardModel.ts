// What a project card shows, decided once: status light, tag cap, stack labels, trait rows, folder split.
// Pure: no React, no DOM.
import { PROJECT_LINK_KEYS, type ProjectLinkKey } from "../../../shared/projects/record";
import type { StatusTone } from "../../components/common/StatusDot";
import type { ProjectView } from "../../../shared/projects/view";

export function cardCategory(p: Pick<ProjectView, "category">): string {
  return p.category.trim() === "" ? "Uncategorised" : p.category.trim();
}

/** The header's status light. A missing folder outranks the stored status. */
export function cardStatus(p: Pick<ProjectView, "status" | "missing">): { tone: StatusTone; label: string } {
  if (p.missing) return { tone: "danger", label: "Folder missing" };
  if (p.status === "active") return { tone: "accent", label: "Active" };
  return { tone: "muted", label: p.status === "paused" ? "Paused" : "Archived" };
}

/** Muted cards: missing or archived. */
export const cardMuted = (p: Pick<ProjectView, "status" | "missing">): boolean => p.missing || p.status === "archived";

/** The first `max` items and how many more there are; when only one would be hidden it is shown instead. */
export function capList<T>(list: readonly T[], max: number): { shown: T[]; more: number } {
  if (list.length <= max + 1) return { shown: list.slice(), more: 0 };
  return { shown: list.slice(0, max), more: list.length - max };
}

const STACK_LABELS: Record<string, string> = {
  node: "Node", typescript: "TypeScript", react: "React", vue: "Vue", svelte: "Svelte", astro: "Astro", next: "Next.js",
  electron: "Electron", vite: "Vite", tauri: "Tauri", rust: "Rust", python: "Python", go: "Go", php: "PHP", ruby: "Ruby",
  java: "Java", dotnet: ".NET", "c-cpp": "C/C++", dart: "Dart", elixir: "Elixir", deno: "Deno", docker: "Docker",
};

/** Display name for a stack id from the scan table; an unknown id is shown as it is. */
export const stackLabel = (id: string): string => STACK_LABELS[id] ?? id;

export type GitInfo = "none" | "unread" | "read";

/** What the git rows can say: "none" (no branch, no commit time: not a repository), "unread" (a branch but no commit time: git was not run) or "read". */
export function gitInfo(p: Pick<ProjectView, "branch" | "lastCommitAt">): GitInfo {
  if (p.lastCommitAt !== null) return "read";
  return p.branch === null ? "none" : "unread";
}

export type TraitRow = "branch" | "lastCommit" | "git" | "stack" | "folder" | "links";

/**
 * The trait rows a card shows, top to bottom. Empty rows are left out: no stack, no links, and for a folder
 * that is not a repository one "Git: none" row in place of the branch and last-commit rows.
 */
export function traitRows(p: Pick<ProjectView, "branch" | "lastCommitAt" | "stack" | "links">): TraitRow[] {
  const rows: TraitRow[] = gitInfo(p) === "none" ? ["git"] : ["branch", "lastCommit"];
  if (p.stack.length > 0) rows.push("stack");
  rows.push("folder");
  if (Object.values(p.links).some((l) => l !== null)) rows.push("links");
  return rows;
}

export const GIT_UNREAD_NOTE = "Git details are not read for repositories with custom git configuration.";

/** The Folder row split so the end (the distinguishing folder name) can stay visible while the front is cut. */
export function splitFolder(folder: string): { head: string; tail: string } {
  const i = Math.max(folder.lastIndexOf("/"), folder.lastIndexOf("\\"));
  return i < 0 || i === folder.length - 1 ? { head: "", tail: folder } : { head: folder.slice(0, i + 1), tail: folder.slice(i + 1) };
}

/** Link buttons on the card and the dossier. (The edit dialog words its fields differently.) */
export const LINK_LABELS: Record<ProjectLinkKey, string> = { repo: "Repo", site: "Site", docs: "Docs" };

/** The link keys a project has, in the fixed order repo, site, docs. */
export const linkKeys = (p: Pick<ProjectView, "links">): ProjectLinkKey[] => PROJECT_LINK_KEYS.filter((k) => p.links[k] !== null);

/** The tooltip for the Branch row: the branch, with a note when the work tree has uncommitted changes. */
export const branchTitle = (p: Pick<ProjectView, "branch" | "dirty">): string | undefined =>
  p.dirty ? `${p.branch ?? "No branch"}: uncommitted changes` : p.branch ?? undefined;

/** The tooltip for the Last commit row: the exact time when it was read, else why it was not. */
export const lastCommitTitle = (p: Pick<ProjectView, "branch" | "lastCommitAt">): string =>
  gitInfo(p) === "read" ? new Date(p.lastCommitAt!).toLocaleString() : GIT_UNREAD_NOTE;
