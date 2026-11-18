/** Copy for the docs page. Feeds src/pages/docs.astro. */
import { product } from "../product";

export const docs = {
  title: "Docs",
  description: `How ${product.name} is laid out, how to install and run it, and how to rebrand it and remove demos.`,
  heading: "Docs",
  lede: `A short manual for ${product.name}: how it is laid out and how to make it your own.`,
  onThisPage: "On this page",
  help: {
    before: "Can't find what you need?",
    linkText: "Get in touch",
    after: "and say what the docs leave out.",
  },
};
