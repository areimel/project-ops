/** Copy for the download page. Feeds src/pages/download.astro. */
import { product } from "../product";

export const download = {
  title: "Download",
  description: `Install ${product.name} on Debian, Ubuntu or Pop!_OS with one command, or download the .deb from GitHub releases.`,
  heading: "Download",
  lede: `The download is the ${product.name} app itself, with its eight demos, so you can try it before you clone the repository.`,
  install: {
    heading: "Install with one command",
    text: "The script finds the newest release, downloads its .deb, checks it against the published SHA256SUMS and installs it with apt. It asks for your password through sudo.",
    commandLabel: "Install command",
  },
  manual: {
    heading: "Install by hand",
    beforeReleases: "Open the",
    releasesLinkText: "releases page",
    afterReleases: "and download the file named",
    beforeInstall: "Then install it from the folder you saved it in with",
    afterInstall: "Compare the file's checksum with the SHA256SUMS file on the same release first.",
    beforeScript: "You can also",
    scriptLinkText: "read the install script",
    afterScript: "before you run it.",
  },
  requirements: {
    heading: "Requirements",
    items: [
      { term: "Operating system", detail: "Linux x64, with a Wayland or X11 session" },
      { term: "Package", detail: "A Debian or Ubuntu based system that installs .deb files" },
      { term: "Windows and macOS", detail: "Build targets are configured but untested" },
      { term: "Building from source", detail: "Node 24 and pnpm" },
    ],
  },
  source: {
    before: "To build on the template rather than just run it, clone the",
    linkText: "repository",
    after: "and build it with Node 24 and pnpm.",
  },
  bugReport: {
    before: "Something not working?",
    linkText: "Report it on GitHub",
    after: "with your distribution and version.",
  },
};
