/** Copy for the contact page. Feeds src/pages/contact.astro. */
import { product } from "../product";

export const contact = {
  title: "Contact",
  description: `Get release updates for ${product.name} or send the maintainer a message.`,
  heading: "Contact",
  lede: "Ask a question, report a problem or follow new releases.",
  signup: {
    heading: "Release updates",
    text: "Leave your email to hear when a new version is published. You will not get anything else.",
  },
  inquiry: {
    heading: "Send a message",
    text: "For questions that do not belong in a public issue. You will get a reply by email.",
  },
  issues: {
    before: "Bugs and feature requests are easier to track on the",
    linkText: "GitHub issue tracker",
    after: "than by email.",
  },
};
