// Pure helpers for the Projects settings section: option lists for the editor and terminal pickers, and
// the wording of a scan result.
import { launchersFor, type LaunchPlatform, type LauncherKind } from "../../shared/launchers";
import type { ScanResult } from "../../shared/ipc/projects";

export const AUTO = "auto";

export interface LauncherOption { value: string; label: string }

export interface LauncherChoices {
  options: LauncherOption[];
  /** The option value for a stored setting (null means automatic; an id this platform lacks falls back to automatic). */
  selected: string;
  /** Text for the picker button. */
  buttonText: string;
}

/**
 * Options for one picker: "Automatic" first (naming the program it resolves to once the installed list is
 * known), then every entry of the table for `platform`. Entries not found are still selectable, marked "not found".
 * `installed` is null until main has answered.
 */
export function launcherChoices(
  kind: LauncherKind, platform: LaunchPlatform, installed: readonly string[] | null, setting: string | null,
): LauncherChoices {
  const table = launchersFor(kind, platform);
  const found = (id: string) => installed?.includes(id) ?? false;
  const first = installed ? table.find((l) => found(l.id)) : undefined;
  const auto = installed === null ? "Automatic (first installed)"
    : first ? `Automatic (${first.label})` : "Automatic (none found)";
  const options: LauncherOption[] = [
    { value: AUTO, label: auto },
    ...table.map((l) => ({ value: l.id, label: installed === null || found(l.id) ? l.label : `${l.label} (not found)` })),
  ];
  const selected = setting !== null && table.some((l) => l.id === setting) ? setting : AUTO;
  const buttonText = options.find((o) => o.value === selected)?.label ?? auto;
  return { options, selected, buttonText };
}

/** The setting a picker value stands for. */
export const settingFromValue = (value: string): string | null => (value === AUTO ? null : value);

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The toast text after a rescan. */
export function scanSummary(r: Pick<ScanResult, "added" | "missing">): string {
  const found = r.added > 0 ? `Found ${plural(r.added, "new project", "new projects")}` : "No new projects";
  if (r.missing <= 0) return found;
  return `${found}. ${plural(r.missing, "project is", "projects are")} no longer on disk.`;
}

export const projectCountLabel = (n: number): string => plural(n, "project", "projects");
