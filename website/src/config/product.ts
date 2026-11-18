/**
 * Facts about the product this site describes. Pure data with no runtime
 * imports so tests can load it under Node.
 * To rebrand, edit the files in this folder.
 */

/** Name, description, repository, licence and author. Feeds headings, meta tags, JSON-LD, the footer and the title block. */
export const product = {
  name: "App Template",
  shortDescription: "An Electron desktop app starter",
  description:
    "App Template is an Electron desktop app starter. It opens on a main menu of eight small demo apps, each showing one desktop skill, on top of shared plumbing for themes, saved data, native menus and a secure main process.",
  packageName: "electron-app-template",
  repo: "areimel/electron-app-template",
  repositoryUrl: "https://github.com/areimel/electron-app-template",
  releasesUrl: "https://github.com/areimel/electron-app-template/releases",
  issuesUrl: "https://github.com/areimel/electron-app-template/issues",
  license: "MIT",
  licenseUrl: "https://github.com/areimel/electron-app-template/blob/main/LICENSE",
  operatingSystem: "Linux",
  applicationCategory: "DeveloperApplication",
  author: { name: "Alec Reimel", url: "https://github.com/areimel" },
};

/** File name of the release .deb for a version. Feeds the download page and the installer text. */
export function debFileName(version = "*"): string {
  return `${product.packageName}_${version}_amd64.deb`;
}
