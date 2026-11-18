import { describe, expect, it } from "vitest";
import { MAX_RECENTS, healRecents, recentId, withRecent } from "../../electron/features/recentsShape";

const r = (n: number) => ({ path: `/v/${n}.mp4`, name: `${n}.mp4`, openedAt: 1000 + n });

describe("healRecents", () => {
  it("keeps a valid list as is", () => {
    expect(healRecents([r(1), r(2)])).toEqual([r(1), r(2)]);
  });
  it("heals non-arrays to []", () => {
    for (const raw of [undefined, null, {}, "x", 4]) expect(healRecents(raw)).toEqual([]);
  });
  it("drops malformed entries and strips extra fields", () => {
    const raw = [
      r(1), null, "x", { path: 3, name: "a", openedAt: 1 }, { path: "rel.mp4", name: "a", openedAt: 1 },
      { path: "/v/n.mp4", name: 1, openedAt: 1 }, { path: "/v/t.mp4", name: "t", openedAt: Number.NaN },
      { ...r(2), extra: "y" },
    ];
    expect(healRecents(raw)).toEqual([r(1), r(2)]);
  });
  it("keeps the first of duplicate paths and caps the length", () => {
    expect(healRecents([r(1), { ...r(1), openedAt: 1 }])).toEqual([r(1)]);
    expect(healRecents(Array.from({ length: 20 }, (_, i) => r(i)))).toHaveLength(MAX_RECENTS);
  });
});

describe("recentId and withRecent", () => {
  it("hashes a path to 16 stable hex characters", () => {
    expect(recentId("/a/b.md")).toMatch(/^[0-9a-f]{16}$/);
    expect(recentId("/a/b.md")).toBe(recentId("/a/b.md"));
    expect(recentId("/a/b.md")).not.toBe(recentId("/a/c.md"));
  });
  it("moves a reopened path to the front without duplicating it, and caps the list", () => {
    expect(withRecent([r(1), r(2)], "/v/2.mp4", "2.mp4", 5).map((x) => x.path)).toEqual(["/v/2.mp4", "/v/1.mp4"]);
    const full = Array.from({ length: MAX_RECENTS }, (_, i) => r(i));
    expect(withRecent(full, "/new.md", "new.md", 1)).toHaveLength(MAX_RECENTS);
  });
});
