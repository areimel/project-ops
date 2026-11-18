/** Copy for the home page. Feeds src/pages/index.astro. */
import { product } from "../product";

export const home = {
  title: `${product.name}: ${product.shortDescription}`,
  description: product.description,
  hero: {
    title: "An Electron app to start from",
    lede: "App Template is a working desktop app with a main menu and eight small demo apps, each showing one desktop skill. Keep the plumbing, swap the demos for your own app.",
    primaryCta: "Download for Linux",
    secondaryCta: "Read the docs",
  },
  sheetIndex: {
    heading: "The sheet index",
    columns: { sheet: "Sheet", demo: "Demo", shows: "What it shows" },
    intro: "The app opens on a ruled index. Each numbered row opens one demo, and each demo teaches one thing you will need in a real desktop app.",
  },
  features: {
    heading: "What every demo shares",
    intro: "Each demo is small because the plumbing underneath it is already done.",
  },
  makeItYours: {
    heading: "Make it yours",
    intro: "The template is meant to be cut down, not built up.",
    steps: [
      "Rebrand the app by editing one file: its name, identifiers and colours live together.",
      "Delete a demo by removing its folder and one line in the registry.",
      "Add your own the same way: a folder and a registry line.",
    ],
  },
  screenshotTitle: product.name,
};
