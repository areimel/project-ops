import { app, shell } from "electron";
import { brand, type LinkKey } from "../../shared/brand";

/** Fixed outside links. Only brand.links keys are ever opened; the renderer never supplies a URL. */
export function openLink(key: LinkKey): void {
  void shell.openExternal(brand.links[key]);
}

export function openExternalHttps(url: string): boolean {
  try {
    if (new URL(url).protocol !== "https:") return false;
  } catch {
    return false;
  }
  void shell.openExternal(url);
  return true;
}

export function setAboutPanel(): void {
  app.setAboutPanelOptions({
    applicationName: brand.name,
    applicationVersion: app.getVersion(),
    copyright: brand.copyright,
    authors: [brand.author],
    website: brand.links.website,
  });
}
