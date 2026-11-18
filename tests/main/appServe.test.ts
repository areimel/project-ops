import { mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { confinedFile, mimeFor, segmentsOf, serveApp } from "../../electron/features/appServe";
import { APP_ORIGIN } from "../../shared/csp";

let root: string;
beforeAll(() => {
  const base = mkdtempSync(join(tmpdir(), "appserve-"));
  root = join(base, "dist");
  mkdirSync(join(root, "assets"), { recursive: true });
  writeFileSync(join(root, "index.html"), "<!doctype html>");
  writeFileSync(join(root, "assets", "a b.js"), "export {}");
  writeFileSync(join(root, "assets", "f.woff2"), "font");
  writeFileSync(join(base, "secret.txt"), "secret");
  symlinkSync(join(base, "secret.txt"), join(root, "assets", "leak.txt"));
  symlinkSync(base, join(root, "up"));
  root = realpathSync(root);
});

describe("segmentsOf", () => {
  it("splits a path and maps / to index.html", () => {
    expect(segmentsOf("/")).toEqual(["index.html"]);
    expect(segmentsOf("/assets/a%20b.js")).toEqual(["assets", "a b.js"]);
  });
  it("refuses traversal, backslashes, NUL and bad escapes", () => {
    for (const p of ["/..", "/a/../b", "/%2e%2e/x", "/a/%2E%2E/x", "/a\\b", "/%5c", "/a%00", "/%zz", "/./x"]) expect(segmentsOf(p), p).toBeNull();
  });
});

describe("confinedFile", () => {
  it("finds regular files inside the root only", async () => {
    expect(await confinedFile(root, "/")).toBe(join(root, "index.html"));
    expect(await confinedFile(root, "/assets/a%20b.js")).toBe(join(root, "assets", "a b.js"));
    expect(await confinedFile(root, "/assets")).toBeNull();        // a directory
    expect(await confinedFile(root, "/missing.js")).toBeNull();
  });
  it("refuses traversal and symlinks that leave the root", async () => {
    expect(await confinedFile(root, "/%2e%2e/secret.txt")).toBeNull();
    expect(await confinedFile(root, "/assets/leak.txt")).toBeNull();
    expect(await confinedFile(root, "/up/secret.txt")).toBeNull();
  });
});

describe("mimeFor", () => {
  it("knows what a page needs and defaults to octet-stream", () => {
    expect(mimeFor("a.js")).toMatch(/^text\/javascript/);
    expect(mimeFor("a.CSS")).toMatch(/^text\/css/);
    expect(mimeFor("a.woff2")).toBe("font/woff2");
    expect(mimeFor("a.html")).toMatch(/^text\/html/);
    expect(mimeFor("a.bin")).toBe("application/octet-stream");
  });
});

describe("serveApp", () => {
  const get = (path: string, method = "GET", host = "renderer") =>
    serveApp(root, `${APP_ORIGIN.replace("renderer", host)}${path}`, method, "default-src 'self'");

  it("serves files with their type, nosniff, and the CSP on html only", async () => {
    const html = await get("/index.html");
    expect(html.status).toBe(200);
    expect(html.headers.get("content-type")).toMatch(/^text\/html/);
    expect(html.headers.get("content-security-policy")).toBe("default-src 'self'");
    expect(html.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await html.text()).toBe("<!doctype html>");
    const js = await get("/assets/a%20b.js?x=1#h");
    expect(js.headers.get("content-type")).toMatch(/^text\/javascript/);
    expect(js.headers.get("content-security-policy")).toBeNull();
  });
  it("answers 404, 405 and wrong hosts without touching the disk outside the root", async () => {
    expect((await get("/nope")).status).toBe(404);
    expect((await get("/assets/leak.txt")).status).toBe(404);
    expect((await get("/index.html", "POST")).status).toBe(405);
    expect((await get("/index.html", "GET", "other")).status).toBe(404);
    expect((await get("/index.html", "HEAD")).status).toBe(200);
  });
});
