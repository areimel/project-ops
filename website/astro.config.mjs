import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { deployDefaults } from "./src/config/deploy.ts";

const envFile = fileURLToPath(new URL(".env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  site: process.env.SITE_URL || deployDefaults.siteUrl,
  base: process.env.SITE_BASE || deployDefaults.siteBase,
  output: "static",
  trailingSlash: "always",
  // No Shiki: its theme paints fixed colours; code blocks use the site tokens (.prose pre).
  markdown: { syntaxHighlight: false },
  integrations: [sitemap({ filter: (page) => !page.endsWith("/404/") })],
});
