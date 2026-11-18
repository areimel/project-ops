import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
import { deployDefaults } from "./src/config/deploy.ts";

const port = Number(process.env.PREVIEW_PORT || 4321);
const base = `/${(process.env.SITE_BASE || deployDefaults.siteBase).replace(/^\/+|\/+$/g, "")}/`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}${base}`,
    browserName: "chromium",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined),
      args: ["--no-sandbox"],
    },
  },
});
