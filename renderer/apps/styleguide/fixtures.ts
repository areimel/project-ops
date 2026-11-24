// Data for the pattern entries. Plain values, no IPC: patterns render from props.
import type { ProjectView } from "../../../shared/projects/view";
import type { ResourceLinkView } from "../../../shared/resources/links";
import type { CardActions } from "../projects/ProjectCard";
import type { TileActions } from "../dashboard/ProjectTile";

/** A fixed "now" (2026-11-24 09:00 UTC) so relative times read the same on every visit. */
export const FIXTURE_NOW = Date.UTC(2026, 10, 24, 9, 0, 0);
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NO_LINKS = { repo: null, site: null, docs: null };

let counter = 0;
/** A project view with sensible defaults; ids are 16 hex characters, unique per call and spread so serials differ. */
export function fixtureProject(overrides: Partial<ProjectView> = {}): ProjectView {
  counter += 1;
  // Mixed, so the serial and the barcode (drawn from the first characters) differ from project to project.
  const mix = (k: number) => ((counter * k) >>> 0).toString(16).padStart(8, "0");
  const id = mix(2654435761) + mix(2246822519);
  const name = overrides.name ?? `Project ${counter}`;
  return {
    id, createdAt: FIXTURE_NOW - 60 * DAY, updatedAt: FIXTURE_NOW - 3 * DAY, name, description: "A short description of what this project is.",
    category: "Clients", tags: ["web", "astro"], status: "active", pinned: false, missing: false, origin: "scan",
    site: { client: "", hosting: "", launchDate: null, services: [], notes: "" },
    links: { ...NO_LINKS }, folder: `~/code/${name.toLowerCase().replace(/\W+/g, "-")}`,
    branch: "main", lastCommitAt: FIXTURE_NOW - 2 * DAY, dirty: false, stack: ["node", "typescript"],
    scannedAt: FIXTURE_NOW - HOUR, lastOpenedAt: FIXTURE_NOW - 5 * HOUR,
    overrides: { name: null, description: null, links: { ...NO_LINKS } },
    detected: { name, description: null, repo: null },
    ...overrides,
  };
}

export const PROJECTS = {
  pinned: fixtureProject({
    name: "Atlas site", pinned: true, tags: ["web", "astro", "client", "launch"],
    links: { repo: "https://github.com/example/atlas-site", site: "https://atlas.example.com/", docs: null },
    site: { client: "Atlas Coffee", hosting: "Netlify", launchDate: "2026-12-05", services: ["Design", "Build"], notes: "Launch call on Friday." },
  }),
  dirty: fixtureProject({ name: "Harbor API", category: "Internal", tags: ["api"], dirty: true, branch: "feature/auth", stack: ["node", "docker"] }),
  noGit: fixtureProject({ name: "Scratch notes", category: "", tags: [], branch: null, lastCommitAt: null, dirty: null, stack: [], origin: "manual" }),
  paused: fixtureProject({ name: "Quiet garden", status: "paused", lastCommitAt: FIXTURE_NOW - 80 * DAY }),
  archived: fixtureProject({ name: "Old brochure", status: "archived", lastCommitAt: FIXTURE_NOW - 400 * DAY }),
  missing: fixtureProject({ name: "Vanished", missing: true }),
  manual: fixtureProject({ name: "Added by hand", origin: "manual", category: "Personal", tags: ["cli"] }),
} satisfies Record<string, ProjectView>;

export const RESOURCE_LINKS: ResourceLinkView[] = [
  { id: "a000000000000001", name: "Netlify", url: "https://app.netlify.com/", group: "Hosting" },
  { id: "a000000000000002", name: "Cloudflare", url: "https://dash.cloudflare.com/", group: "Hosting" },
  { id: "a000000000000003", name: "Plausible", url: "https://plausible.io/", group: "Analytics" },
  { id: "a000000000000004", name: "Search Console", url: "https://search.google.com/search-console", group: "Analytics" },
  { id: "a000000000000005", name: "Time tracker", url: "https://example.com/time", group: "" },
];

const noop = () => {};
export const NOOP_CARD_ACTIONS: CardActions = {
  open: noop, openLink: noop, copyPath: noop, togglePin: noop, edit: noop, show: noop, refresh: noop, filterTag: noop, filterCategory: noop,
};
export const NOOP_TILE_ACTIONS: TileActions = { open: noop, show: noop };
