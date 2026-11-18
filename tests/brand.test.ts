import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "../shared/brand";

const read = (file: string): string => readFileSync(resolve(__dirname, "..", file), "utf8");
const pkg = JSON.parse(read("package.json")) as Record<string, unknown> & { repository: { url: string } };
const builder = read("electron-builder.yml");
/** First top-level `key: value` of the YAML. */
const yamlTop = (key: string): string | undefined => builder.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"))?.[1];

describe("brand matches package.json", () => {
  it("name and desktop file use the package name", () => {
    expect(pkg.name).toBe(brand.packageName);
    expect(pkg.desktopName).toBe(`${brand.packageName}.desktop`);
  });
  it("productName, description, author and homepage", () => {
    expect(pkg.productName).toBe(brand.name);
    expect(pkg.description).toBe(brand.tagline);
    expect(pkg.author).toBe(brand.author);
    expect(pkg.homepage).toBe(brand.links.website);
  });
  it("repository points at the source link", () => {
    expect(pkg.repository.url.replace(/\.git$/, "")).toBe(brand.links.source);
  });
});

describe("brand matches electron-builder.yml", () => {
  it("appId, productName and copyright", () => {
    expect(yamlTop("appId")).toBe(brand.appId);
    expect(yamlTop("productName")).toBe(brand.name);
    expect(yamlTop("copyright")).toBe(brand.copyright);
  });
  it("registers the deep-link scheme", () => {
    expect(builder).toMatch(new RegExp(`^protocols:[\\s\\S]*?schemes:\\s*\\n\\s*- ${brand.scheme}\\s*$`, "m"));
    expect(builder).toContain(`x-scheme-handler/${brand.scheme}`);
  });
  it("names the executable and artifacts after the package", () => {
    expect(builder).toMatch(new RegExp(`^\\s+executableName: ${brand.packageName}$`, "m"));
    expect(yamlTop("artifactName")).toMatch(new RegExp(`^${brand.packageName}_`));
  });
  it("ships the tray icon as a resource", () => {
    expect(builder).toMatch(/from: build\/tray\.png\s*\n\s+to: tray\.png/);
  });
});
