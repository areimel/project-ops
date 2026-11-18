import { describe, expect, it } from "vitest";
import {
  CACHE_TTL_MS, commentsUrl, healCache, healIds, healItem, hostOf, isFresh, mapLimit, safeUrl, toItem,
} from "../../electron/features/newsModel";
import { clockTime, plural, relativeTime } from "../../renderer/apps/news/relativeTime";

const good = { id: 42, type: "story", title: "A story", url: "https://www.example.com/a?b=1", score: 142, by: "pg", descendants: 38, time: 1_700_000_000 };

describe("healItem", () => {
  it("keeps a good story and drops unknown fields", () => {
    const s = healItem({ ...good, extra: "<script>", kids: [1, 2] });
    expect(s).toEqual({ id: 42, title: "A story", url: "https://www.example.com/a?b=1", score: 142, by: "pg", descendants: 38, time: 1_700_000_000 });
  });
  it("accepts an Ask HN post without url or comments", () => {
    expect(healItem({ id: 1, type: "story", title: "Ask HN: x", score: 3, by: "a", time: 5 }))
      .toMatchObject({ url: null, descendants: 0 });
  });
  it("rejects non-objects, bad ids, missing titles, jobs, polls, dead and deleted items", () => {
    for (const raw of [null, undefined, 5, "x", [], { ...good, id: 0 }, { ...good, id: -1 }, { ...good, id: 1.5 }, { ...good, id: "7" },
      { ...good, title: "" }, { ...good, title: "   " }, { ...good, title: 9 }, { ...good, type: "job" }, { ...good, type: "poll" },
      { ...good, dead: true }, { ...good, deleted: true }]) expect(healItem(raw), JSON.stringify(raw)).toBeNull();
  });
  it("replaces wrongly typed numbers and text with safe defaults", () => {
    expect(healItem({ ...good, score: "9", descendants: -4, time: NaN, by: { x: 1 } }))
      .toMatchObject({ score: 0, descendants: 0, time: 0, by: "" });
  });
  it("caps huge strings", () => {
    const s = healItem({ ...good, title: "x".repeat(100_000), by: "y".repeat(100_000), url: "https://a.com/" + "z".repeat(5000) });
    expect(s?.title.length).toBe(300);
    expect(s?.by.length).toBe(64);
    expect(s?.url).toBeNull();
  });
  it("is idempotent, so a cached story heals to itself", () => {
    const s = healItem(good);
    expect(healItem(s)).toEqual(s);
  });
  it("keeps markup as plain text, never interprets it", () => {
    expect(healItem({ ...good, title: "<img src=x onerror=alert(1)>" })?.title).toBe("<img src=x onerror=alert(1)>");
  });
});

describe("safeUrl", () => {
  it("keeps https only", () => {
    expect(safeUrl("https://example.com/x")).toBe("https://example.com/x");
    for (const u of ["http://example.com", "javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "ftp://a.com", "//a.com",
      "https://user:pw@example.com/", "not a url", "", 5, null, {}]) expect(safeUrl(u), String(u)).toBeNull();
  });
});

describe("hostOf", () => {
  it("returns the host without www", () => {
    expect(hostOf("https://www.example.com/a")).toBe("example.com");
    expect(hostOf("https://blog.example.co.uk:8443/a")).toBe("blog.example.co.uk");
  });
  it("returns null without a usable url", () => {
    expect(hostOf(null)).toBeNull();
    expect(hostOf("")).toBeNull();
    expect(hostOf("nope")).toBeNull();
  });
});

describe("isFresh", () => {
  it("is fresh inside the TTL and stale at or after it", () => {
    expect(isFresh(1000, 1000 + CACHE_TTL_MS - 1)).toBe(true);
    expect(isFresh(1000, 1000 + CACHE_TTL_MS)).toBe(false);
  });
  it("is never fresh with no timestamp or a timestamp in the future", () => {
    expect(isFresh(0, 5)).toBe(false);
    expect(isFresh(10_000, 5)).toBe(false);
  });
});

describe("toItem, healIds, commentsUrl", () => {
  it("gives the renderer a host and no url", () => {
    const item = toItem(healItem(good)!);
    expect(item).toEqual({ id: 42, title: "A story", host: "example.com", score: 142, by: "pg", comments: 38, time: 1_700_000_000 });
    expect("url" in item).toBe(false);
  });
  it("keeps the first valid ids up to the limit and rejects non-lists", () => {
    expect(healIds([5, "x", 6, -1, 7, 8], 3)).toEqual([5, 6, 7]);
    expect(() => healIds({ a: 1 })).toThrow();
  });
  it("builds the discussion address from the id alone", () => {
    expect(commentsUrl(42)).toBe("https://news.ycombinator.com/item?id=42");
  });
});

describe("healCache", () => {
  it("heals anything to an object and re-validates stored stories", () => {
    for (const raw of [undefined, null, 5, "x", [], { feeds: 3 }, { feeds: { top: 4 } }]) expect(healCache(raw)).toEqual({});
    const c = healCache({ version: 1, feeds: { top: { fetchedAt: 5000, stories: [good, { id: -1 }, "x"] }, hot: { fetchedAt: 1, stories: [good] } } });
    expect(Object.keys(c)).toEqual(["top"]);
    expect(c.top?.stories).toHaveLength(1);
  });
  it("drops a feed with a bad timestamp or no list", () => {
    expect(healCache({ feeds: { top: { fetchedAt: "x", stories: [good] }, new: { fetchedAt: 5, stories: "no" } } })).toEqual({});
  });
});

describe("mapLimit", () => {
  it("never runs more than the limit at once and keeps the order", async () => {
    let active = 0, peak = 0;
    const out = await mapLimit([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 6, async (n) => {
      active++; peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return n * 2;
    });
    expect(peak).toBe(6);
    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
  });
  it("handles an empty list", async () => {
    expect(await mapLimit([], 6, async (x) => x)).toEqual([]);
  });
});

describe("relativeTime", () => {
  const now = 1_700_000_000_000;
  const ago = (s: number) => relativeTime(now / 1000 - s, now);
  it("uses plain words", () => {
    expect(ago(5)).toBe("just now");
    expect(ago(60)).toBe("1 minute ago");
    expect(ago(59 * 60)).toBe("59 minutes ago");
    expect(ago(3 * 3600)).toBe("3 hours ago");
    expect(ago(86400)).toBe("1 day ago");
    expect(ago(2 * 7 * 86400)).toBe("2 weeks ago");
    expect(ago(90 * 86400)).toBe("3 months ago");
    expect(ago(800 * 86400)).toBe("2 years ago");
  });
  it("treats the future and nonsense as just now", () => {
    expect(ago(-500)).toBe("just now");
    expect(relativeTime(NaN, now)).toBe("just now");
  });
  it("plural and clockTime", () => {
    expect(plural(1, "point")).toBe("1 point");
    expect(plural(0, "comment")).toBe("0 comments");
    expect(plural(2, "story", "stories")).toBe("2 stories");
    expect(clockTime(now)).toMatch(/\d/);
  });
});
