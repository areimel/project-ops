/**
 * Shared copy and data used on more than one page.
 * To rebrand, edit the files in this folder.
 */
import { product } from "./product";

/** The demo apps in registry order; the number is the sheet number on the main menu. Feeds the home page sheet index. */
export const demos: { number: number; name: string; skill: string }[] = [
  { number: 1, name: "Notes", skill: "create, edit and delete records through a shared collection hook, with search and debounced autosave" },
  { number: 2, name: "Tasks", skill: "filter and reorder a list, and undo a delete from a toast" },
  { number: 3, name: "Editor", skill: "open and save dialogs, recent files, drag and drop, an unsaved-changes guard, file association and a Markdown preview" },
  { number: 4, name: "Clipboard", skill: "read and write the system clipboard and keep saved snippets" },
  { number: 5, name: "Timer", skill: "state owned by the main process, with native notifications and a tray icon" },
  { number: 6, name: "System info", skill: "live data pushed from the main process while the window is subscribed" },
  { number: 7, name: "News", skill: "API calls made through the main process, with a cache and loading, offline and error states" },
  { number: 8, name: "Player", skill: "a custom file protocol with an allowlist, and fullscreen" },
];

/** What the shared plumbing gives every demo. Feeds the home page features section. */
export const features: { title: string; copy: string }[] = [
  {
    title: "Three themes, light and dark",
    copy: "Blueprint, Graphite and Kraft each come in a light and a dark variant. Pick an accent colour to override the theme's own, and the choice is saved.",
  },
  {
    title: "Saved data as JSON files",
    copy: "Settings, window size and position, and each demo's records are written as validated JSON files in the user data folder. No database to set up.",
  },
  {
    title: "Native desktop integration",
    copy: "A native menu, tray icon, notifications, file dialogs, the clipboard and window state are wired up once and reachable from any demo.",
  },
  {
    title: "A locked-down main process",
    copy: "The renderer is sandboxed with context isolation. Every IPC message is validated, the renderer never supplies file paths, and network calls go only to allowlisted hosts.",
  },
  {
    title: "Small enough to cut down",
    copy: "Each demo lives in its own folder and one registry line. Delete both and it is gone from the menu, the code and the build.",
  },
];

/** Screenshot slots. Each src is relative to the site base and goes through url(). Feeds WindowFrame on the home and docs pages. */
export const screenshots: Record<
  "home" | "notes" | "themes",
  { src: string; width: number; height: number; alt: string; caption: string }
> = {
  home: {
    src: "images/home.webp",
    width: 1440,
    height: 900,
    alt: "The App Template main menu: a ruled list of eight demo apps.",
    caption: "The main menu: a ruled sheet index of the eight demos.",
  },
  notes: {
    src: "images/notes.webp",
    width: 1440,
    height: 900,
    alt: "The Notes demo with a note list, a search field and an open note.",
    caption: "The Notes demo: a list, search and an autosaving editor.",
  },
  themes: {
    src: "images/themes.webp",
    width: 1440,
    height: 900,
    alt: "The Settings theme editor showing the Blueprint, Graphite and Kraft themes and an accent colour picker.",
    caption: "Settings: three themes, light and dark, and an accent colour.",
  },
};

/** Footer text. Feeds the footer and the title block. */
export const footer = {
  navLabel: "Footer navigation",
  repositoryLabel: "Source on GitHub",
  authorCredit: `Made by ${product.author.name}`,
  licenseNote: `Released under the ${product.license} licence.`,
  revision: "Revision A",
};

/** Page title and social defaults. Feeds SiteLayout. */
export const meta = {
  homeTitle: `${product.name}: ${product.shortDescription}`,
  titleSuffix: product.name,
  socialImageAlt: `${product.name}, ${product.shortDescription.toLowerCase()}`,
  /** Browser chrome colour per scheme; keep equal to --bg in src/styles/global.css. */
  themeColors: { light: "#EEF2F6", dark: "#0F2A52" },
};
