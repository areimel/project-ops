import type { ProjectView } from "../../../../shared/projects/view";

/** Pure helpers for the project dossier page. */

/** "PO-" plus the first 12 hex characters of the id in groups of four. Non-hex characters are dropped. */
export function fileSerial(id: string): string {
  const hex = id.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 12).padEnd(12, "0");
  return `PO-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

export interface Bar { x: number; w: number }

/** Deterministic bars from the hex nibbles of the id, with a guard bar at each end. */
export function barcodeBars(id: string): { bars: Bar[]; width: number } {
  const nibbles = id.toLowerCase().replace(/[^0-9a-f]/g, "").split("").map((c) => parseInt(c, 16));
  if (nibbles.length === 0) nibbles.push(0);
  const bars: Bar[] = [];
  let x = 0;
  const add = (w: number, gap: number) => { bars.push({ x, w }); x += w + gap; };
  add(1, 1); add(1, 2); // start guard
  for (const n of nibbles) add((n & 3) % 3 + 1, ((n >> 2) & 1) + 1);
  add(1, 1); add(1, 0); // end guard
  return { bars, width: x };
}

/** Hostname without a leading "www.", or null when there is no usable URL. */
export function siteDomain(site: string | null): string | null {
  if (!site) return null;
  try {
    const host = new URL(site).hostname.replace(/^www\./i, "");
    return host || null;
  } catch {
    return null;
  }
}

/** YYYY-MM-DD in UTC, independent of locale and time zone. */
export function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface SiteRow { key: "client" | "hosting" | "domain" | "launch"; label: string; value: string }

export function siteRows(p: Pick<ProjectView, "site" | "links">): SiteRow[] {
  const rows: SiteRow[] = [];
  if (p.site.client) rows.push({ key: "client", label: "Client", value: p.site.client });
  if (p.site.hosting) rows.push({ key: "hosting", label: "Hosting", value: p.site.hosting });
  const domain = siteDomain(p.links.site);
  if (domain) rows.push({ key: "domain", label: "Domain", value: domain });
  if (p.site.launchDate) rows.push({ key: "launch", label: "Launch", value: p.site.launchDate });
  return rows;
}

export function hasSiteDetails(p: Pick<ProjectView, "site" | "links">): boolean {
  return siteRows(p).length > 0 || p.site.services.length > 0 || p.site.notes.trim() !== "";
}

export interface TimelineEvent { key: string; label: string; at: number }

export function timeline(
  p: Pick<ProjectView, "createdAt" | "updatedAt" | "lastCommitAt" | "lastOpenedAt" | "scannedAt" | "site">,
): TimelineEvent[] {
  const events: TimelineEvent[] = [{ key: "added", label: "Added", at: p.createdAt }];
  if (p.site.launchDate) {
    const at = Date.parse(`${p.site.launchDate}T00:00:00Z`);
    if (Number.isFinite(at)) events.push({ key: "launched", label: "Launched", at });
  }
  if (p.lastCommitAt != null) events.push({ key: "commit", label: "Last commit", at: p.lastCommitAt });
  events.push({ key: "edited", label: "Last edited", at: p.updatedAt });
  if (p.lastOpenedAt != null) events.push({ key: "opened", label: "Last opened", at: p.lastOpenedAt });
  if (p.scannedAt != null) events.push({ key: "scanned", label: "Scanned", at: p.scannedAt });
  return events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.at - b.e.at || a.i - b.i)
    .map(({ e }) => e);
}

/** A short "host/owner/repo" label for a remote URL, or null when there is none. */
export function remoteLabel(repo: string | null): string | null {
  if (!repo) return null;
  try {
    const u = new URL(repo);
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    const host = u.hostname.replace(/^www\./i, "");
    return path ? `${host}/${path}` : host;
  } catch {
    return repo;
  }
}
