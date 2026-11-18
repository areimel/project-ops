import type { CommandSpec } from "../../shared/commands";

const words = (s: string): string[] => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/**
 * Pure. Every word you type must start a word of the label or group ("new no" finds "New note").
 * Commands marked `palette: false` never appear. Shell commands come first, otherwise the order is kept.
 */
export function filterCommands(query: string, commands: readonly CommandSpec[]): CommandSpec[] {
  const q = words(query);
  const hits = commands.filter((c) => {
    if (c.palette === false) return false;
    if (!q.length) return true;
    const hay = words(`${c.label} ${c.group}`);
    return q.every((t) => hay.some((w) => w.startsWith(t)));
  });
  const shell = hits.filter((c) => c.id.startsWith("shell."));
  return [...shell, ...hits.filter((c) => !c.id.startsWith("shell."))];
}
