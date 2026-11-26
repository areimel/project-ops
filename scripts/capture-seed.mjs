// Seeds an Electron user-data profile for the screenshot harness (CLAUDE.md, "Verifying without a person").
//   node scripts/capture-seed.mjs <dir> [--light]
// Writes <dir>/work/* (real folders with a package.json), projects.json (six records), resource-links.json
// (five links in two groups plus one ungrouped) and, with --light, settings.json. Fixed ids and times, so runs match.
//
// Project ids (the first is the one to use in deep links, project-ops://open/projects/<id>):
//   1000000000000001  atlas-site     pinned, active, 7 tags, links, site details
//   1000000000000002  harbor-api     active, dirty git data, several stack ids
//   1000000000000003  quiet-garden   paused
//   1000000000000004  old-brochure   archived (hidden from the grid by the default status filter)
//   1000000000000005  vanished       folder does not exist, shows as missing
//   1000000000000006  scratch-notes  manual, no git
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const args = process.argv.slice(2);
const light = args.includes("--light");
const dirArg = args.find((a) => !a.startsWith("--"));
if (!dirArg) {
  console.error("usage: node scripts/capture-seed.mjs <dir> [--light]");
  process.exit(2);
}
const dir = resolve(dirArg);
const work = join(dir, "work");
const T0 = Date.UTC(2026, 10, 20, 9, 0, 0); // fixed "now" for the seed
const DAY = 86_400_000;

const folders = {
  "atlas-site": join(work, "clients", "atlas-site"),
  "harbor-api": join(work, "harbor-api"),
  "quiet-garden": join(work, "quiet-garden"),
  "old-brochure": join(work, "old-brochure"),
  "vanished": join(work, "vanished-does-not-exist"),
  "scratch-notes": join(work, "scratch-notes"),
};
for (const [name, p] of Object.entries(folders)) {
  if (name === "vanished") continue;
  mkdirSync(p, { recursive: true });
  writeFileSync(join(p, "package.json"), JSON.stringify({ name, description: `Seeded ${name}` }) + "\n");
}

const noLinks = { repo: null, site: null, docs: null };
const noSite = { client: "", hosting: "", launchDate: null, services: [], notes: "" };
const scan = (name, over = {}) => ({
  name, description: null, repoUrl: null, branch: null, lastCommitAt: null, dirty: null, stack: ["node"], scannedAt: T0, ...over,
});
const rec = (id, i, path, over) => ({
  id, createdAt: T0 - (30 - i) * DAY, updatedAt: T0 - (10 - i) * DAY, path,
  origin: "manual", rootId: null, missing: false, hidden: false, name: null, description: null,
  category: "", tags: [], status: "active", pinned: false, site: noSite, links: noLinks, lastOpenedAt: null,
  scan: scan("x"), ...over,
});

const projects = [
  rec("1000000000000001", 1, folders["atlas-site"], {
    origin: "scan", name: "Atlas site", description: "Marketing site for the Atlas rebrand.",
    category: "Clients", tags: ["web", "astro", "client", "launch", "seo", "design", "2026"],
    pinned: true, lastOpenedAt: T0 - 2 * 3_600_000,
    links: { repo: "https://github.com/example/atlas-site", site: "https://atlas.example.com/", docs: "https://docs.example.com/atlas" },
    site: { client: "Atlas Coffee", hosting: "Netlify", launchDate: "2026-12-05", services: ["Design", "Build", "SEO"], notes: "Launch call on Friday.\nDNS is with the client." },
    scan: scan("atlas-site", { description: "Seeded atlas-site", repoUrl: "https://github.com/example/atlas-site", branch: "main", lastCommitAt: T0 - 3 * DAY, dirty: false, stack: ["node", "astro", "typescript"] }),
  }),
  rec("1000000000000002", 2, folders["harbor-api"], {
    origin: "scan", category: "Tools", tags: ["api", "node"], lastOpenedAt: T0 - DAY,
    scan: scan("harbor-api", { description: "Harbor service API", repoUrl: "https://github.com/example/harbor-api", branch: "main", lastCommitAt: T0 - 2 * 3_600_000, dirty: true, stack: ["node", "typescript", "docker", "postgres"] }),
  }),
  rec("1000000000000003", 3, folders["quiet-garden"], {
    origin: "scan", status: "paused", category: "Personal", tags: ["blog"], lastOpenedAt: T0 - 4 * DAY,
    scan: scan("quiet-garden", { branch: "main", lastCommitAt: T0 - 40 * DAY, dirty: false, stack: ["node", "vite"] }),
  }),
  rec("1000000000000004", 4, folders["old-brochure"], {
    origin: "scan", status: "archived", category: "Clients", tags: ["legacy"],
    scan: scan("old-brochure", { branch: "master", lastCommitAt: T0 - 400 * DAY, dirty: false, stack: ["html"] }),
  }),
  rec("1000000000000005", 5, folders["vanished"], {
    origin: "scan", missing: true, category: "Personal", tags: ["moved"],
    scan: scan("vanished-does-not-exist", { branch: "main", lastCommitAt: T0 - 90 * DAY, dirty: false }),
  }),
  rec("1000000000000006", 6, folders["scratch-notes"], {
    scan: scan("scratch-notes", { stack: ["node"] }),
  }),
];

const link = (n, name, url, group) => ({ id: `200000000000000${n}`, createdAt: T0 - n * DAY, updatedAt: T0 - n * DAY, name, url, group });
const links = [
  link(1, "Netlify", "https://app.netlify.com/", "Hosting"),
  link(2, "Cloudflare", "https://dash.cloudflare.com/", "Hosting"),
  link(3, "Namecheap", "https://www.namecheap.com/", "Domains"),
  link(4, "Google Search Console", "https://search.google.com/search-console", "Domains"),
  link(5, "Plausible", "https://plausible.io/", "Domains"),
  link(6, "Status page", "https://status.example.com/", ""),
];

const put = (file, data) => writeFileSync(join(dir, file), JSON.stringify(data) + "\n");
mkdirSync(dir, { recursive: true });
put("projects.json", { version: 1, items: projects });
put("resource-links.json", { version: 1, items: links });
if (light) put("settings.json", { version: 1, values: { mode: "light" } });

console.log(`profile: ${dir}`);
console.log(`first project id: ${projects[0].id}`);
