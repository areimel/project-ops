// Wording shared by the project grid and Settings. Pure.
import type { ScanResult } from "../../shared/ipc/projects";
import { plural } from "./plural";

/** "1 project", "42 projects". */
export const projectCount = (n: number): string => plural(n, "project", "projects");

/** The toast after a scan. */
export function scanMessage(r: Pick<ScanResult, "added" | "missing">): string {
  const found = r.added > 0 ? `Found ${plural(r.added, "new project", "new projects")}` : "No new projects";
  return r.missing > 0 ? `${found}. ${plural(r.missing, "folder is", "folders are")} missing.` : found;
}
