/**
 * Where the site is served from. Pure data with no imports so that
 * astro.config.mjs, playwright.config.ts, scripts and tests can load it
 * directly under Node. SITE_URL and SITE_BASE in the environment override it.
 * To rebrand, edit the files in this folder.
 */
export const deployDefaults = {
  /** Origin only, no path. Feeds Astro's `site` option. */
  siteUrl: "https://areimel.github.io",
  /** Path the site lives under, with a leading slash and no trailing one. Feeds Astro's `base` option. */
  siteBase: "/electron-app-template",
};
