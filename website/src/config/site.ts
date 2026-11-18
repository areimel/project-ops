/**
 * Runtime helpers for pages: URL building, the install command, navigation.
 * To rebrand, edit the files in this folder (product.ts first).
 */

export { product, debFileName } from "./product";

/** Site-relative URL that respects the configured base path. Feeds every internal link and asset. */
export function url(path = ""): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

/** Absolute URL of a path on this site (origin from SITE_URL, path through url()). Feeds canonical and social meta. */
export function absoluteUrl(path = ""): string {
  return new URL(url(path), import.meta.env.SITE).href;
}

/** The one-line installer. Feeds the download page command block. */
export const installCommand = `curl -fsSL ${absoluteUrl("install.sh")} | bash`;

/** Main navigation; the position in this list is the sheet number in the title block. Feeds the header and footer. */
export const navigation: { label: string; path: string }[] = [
  { label: "Home", path: "" },
  { label: "Download", path: "download/" },
  { label: "Docs", path: "docs/" },
  { label: "Contact", path: "contact/" },
];

/** localStorage key for the chosen colour theme. Feeds the theme toggle and the head script. */
export const themeStorageKey = "site-theme";

