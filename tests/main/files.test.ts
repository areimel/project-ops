import { describe, expect, it } from "vitest";
import { displayFolder, displayPath, elideMiddle, safeFileName } from "../../electron/features/filesCore";

const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);

describe("displayFolder", () => {
  it("shortens the home directory to ~", () => {
    expect(displayFolder("/home/al/docs/a.md", "/home/al")).toBe("~/docs");
    expect(displayFolder("/home/al/a.md", "/home/al")).toBe("~");
  });
  it("leaves other folders and lookalike prefixes alone", () => {
    expect(displayFolder("/tmp/a.md", "/home/al")).toBe("/tmp");
    expect(displayFolder("/home/alex/a.md", "/home/al")).toBe("/home/alex");
    expect(displayFolder("/tmp/a.md", "")).toBe("/tmp");
  });
});

describe("elideMiddle", () => {
  it("leaves a path that fits", () => {
    expect(elideMiddle("/tmp/a")).toBe("/tmp/a");
    expect(elideMiddle("x".repeat(40))).toBe("x".repeat(40));
  });
  it("drops middle segments and keeps the head and the leaf", () => {
    const out = elideMiddle("~/projects/clients/acme/website/redesign/notes");
    expect(out).toBe("~/…/clients/acme/website/redesign/notes");
    expect(out.length).toBeLessThanOrEqual(40);
    expect(elideMiddle("/home/al/a/very/long/folder/path/that/keeps/going/leaf")).toMatch(/^\/…\/.*leaf$/);
  });
  it("always keeps the last segment, cutting it when it alone is too long", () => {
    const out = elideMiddle(`/a/${"z".repeat(60)}`);
    expect(out.startsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(40);
  });
  it("handles Windows separators", () => {
    const out = elideMiddle("C:\\Users\\al\\Documents\\projects\\clients\\acme\\website\\notes");
    expect(out.startsWith("C:\\…\\")).toBe(true);
    expect(out.endsWith("\\notes")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(40);
  });
});

describe("displayFolder, long paths", () => {
  it("elides after shortening the home directory", () => {
    const out = displayFolder("/home/al/work/clients/acme/website/redesign/final/drafts/a.md", "/home/al");
    expect(out.startsWith("~/…/")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out).not.toContain("/home/al");
  });
});

describe("displayPath", () => {
  it("shows the folder itself, home as ~", () => {
    expect(displayPath("/home/al/work/app", "/home/al")).toBe("~/work/app");
    expect(displayPath("/home/al", "/home/al")).toBe("~");
    expect(displayPath("/home/alex/app", "/home/al")).toBe("/home/alex/app");
    expect(displayPath("/srv/app", "")).toBe("/srv/app");
  });
  it("keeps the head and the last two segments of a long path", () => {
    const home = "/home/alec";
    expect(displayPath("/home/alec/code_projects/desktop-app-projects/project-ops", home))
      .toBe("~/…/desktop-app-projects/project-ops");
    expect(displayPath("/var/lib/some/very/long/chain/of/folders/client/site", "/home/al")).toBe("/…/client/site");
  });
  it("never contains the home folder and stays within the limit", () => {
    const out = displayPath(`/home/al/a/b/${"x".repeat(30)}/${"y".repeat(30)}`, "/home/al");
    expect(out).not.toContain("/home/al");
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out.endsWith("y".repeat(10))).toBe(true);
  });
  it("handles Windows paths", () => {
    expect(displayPath("C:\\Users\\al\\Documents\\projects\\clients\\acme-corp\\website", "C:\\Users\\al"))
      .toBe("~\\…\\acme-corp\\website");
  });
});
