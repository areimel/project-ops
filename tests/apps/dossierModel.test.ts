import { describe, expect, it } from "vitest";
import { barcodeBars, fileSerial, formatDate, hasSiteDetails, remoteLabel, siteDomain, siteRows, timeline } from "../../renderer/apps/projects/dossier/dossierModel";
import type { ProjectSite } from "../../shared/projects/record";

const site = (o: Partial<ProjectSite> = {}): ProjectSite => ({ client: "", hosting: "", launchDate: null, services: [], notes: "", ...o });
const view = (o: { site?: Partial<ProjectSite>; siteLink?: string | null } = {}) => ({
  site: site(o.site), links: { repo: null, site: o.siteLink ?? null, docs: null },
});

describe("fileSerial", () => {
  it("groups the first 12 hex chars", () => expect(fileSerial("0123456789abcdef")).toBe("PO-0123-4567-89AB"));
  it("copes with short and non-hex ids", () => {
    expect(fileSerial("zz1")).toBe("PO-1000-0000-0000");
    expect(fileSerial("")).toBe("PO-0000-0000-0000");
  });
});

describe("barcodeBars", () => {
  it("is deterministic with guard bars and in-range widths", () => {
    const a = barcodeBars("0123456789abcdef");
    expect(a).toEqual(barcodeBars("0123456789abcdef"));
    expect(a.bars.length).toBe(16 + 4);
    expect(a.bars.every((b) => b.w >= 1 && b.w <= 3)).toBe(true);
    const last = a.bars[a.bars.length - 1];
    expect(last.x + last.w).toBe(a.width);
  });
  it("differs per id and survives junk", () => {
    expect(barcodeBars("ffff").bars).not.toEqual(barcodeBars("0000").bars);
    expect(barcodeBars("").bars.length).toBeGreaterThan(2);
  });
});

describe("siteDomain", () => {
  it("strips www and rejects junk", () => {
    expect(siteDomain("https://www.example.com/a")).toBe("example.com");
    expect(siteDomain("https://app.example.com")).toBe("app.example.com");
    expect(siteDomain("nope")).toBeNull();
    expect(siteDomain(null)).toBeNull();
  });
});

describe("siteRows", () => {
  it("lists only set values in order", () => {
    const rows = siteRows(view({ site: { client: "Acme", launchDate: "2026-01-02" }, siteLink: "https://www.acme.com" }));
    expect(rows.map((r) => [r.key, r.value])).toEqual([["client", "Acme"], ["domain", "acme.com"], ["launch", "2026-01-02"]]);
  });
  it("hasSiteDetails covers rows, services and notes", () => {
    expect(hasSiteDetails(view())).toBe(false);
    expect(hasSiteDetails(view({ site: { services: ["SEO"] } }))).toBe(true);
    expect(hasSiteDetails(view({ site: { notes: " x " } }))).toBe(true);
    expect(hasSiteDetails(view({ site: { notes: "  " } }))).toBe(false);
    expect(hasSiteDetails(view({ siteLink: "https://a.com" }))).toBe(true);
  });
});

describe("formatDate and timeline", () => {
  it("formats UTC dates", () => expect(formatDate(Date.UTC(2026, 10, 5, 23, 59))).toBe("2026-11-05"));
  it("sorts ascending, drops nulls, stable on ties", () => {
    const t = timeline({ createdAt: 100, updatedAt: 100, lastCommitAt: 50, lastOpenedAt: null, scannedAt: 200, site: site({ launchDate: "1970-01-01" }) });
    expect(t.map((e) => e.key)).toEqual(["launched", "commit", "added", "edited", "scanned"]);
    expect(t[0].at).toBe(0);
  });
});

describe("remoteLabel", () => {
  it("shortens a remote URL", () => {
    expect(remoteLabel("https://github.com/a/b")).toBe("github.com/a/b");
    expect(remoteLabel("https://www.example.com/")).toBe("example.com");
    expect(remoteLabel(null)).toBeNull();
  });
});
