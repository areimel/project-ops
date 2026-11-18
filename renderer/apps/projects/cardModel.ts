// What a project card shows, decided once: numbering, status light, tag cap, stack labels, scan toast.
// Pure: no React, no DOM.
import type { StatusTone } from "../../components/common/StatusDot";
import type { ScanResult } from "../../../shared/ipc/projects";
import type { ProjectView } from "../../../shared/projects/view";

/** "01".."99", then "100": the card's position in the current result, counting from 1. */
export function cardNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

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

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The toast after Rescan. */
export function scanMessage(r: ScanResult): string {
  const found = r.added > 0 ? `Found ${plural(r.added, "new project", "new projects")}` : "No new projects";
  return r.missing > 0 ? `${found}. ${plural(r.missing, "folder is", "folders are")} missing.` : found;
}

/** Title-block count: "1 project", "42 projects". */
export const projectCount = (n: number): string => plural(n, "project", "projects");
