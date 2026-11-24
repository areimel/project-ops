import { describe, expect, it } from "vitest";
import {
  FAMILIES, activeEntry, anchorId, collectEntries, contrastGrade, contrastPairs, framesFor, railGroups, sheetSerial,
} from "../../renderer/apps/styleguide/styleguideModel";

const spec = { label: "x", render: () => null };
const e = (id: string, family = "actions", title = id) => ({ entry: { id, title, family, specimens: [spec] } });

describe("collectEntries", () => {
  it("sorts by family order, then title", () => {
    const out = collectEntries({ "./a.tsx": e("zeta", "actions", "Zeta"), "./b.tsx": e("col", "foundations", "Colour"), "./c.tsx": e("alpha", "actions", "Alpha") });
    expect(out.map((x) => x.id)).toEqual(["col", "alpha", "zeta"]);
  });
  it("names the file for each kind of error", () => {
    expect(() => collectEntries({ "./a.tsx": {} })).toThrow(/\.\/a\.tsx/);
    expect(() => collectEntries({ "./b.tsx": e("Bad_Id") })).toThrow(/\.\/b\.tsx.*Bad_Id/);
    expect(() => collectEntries({ "./a.tsx": e("one"), "./b.tsx": e("one") })).toThrow(/\.\/b\.tsx.*duplicate.*\.\/a\.tsx/);
    expect(() => collectEntries({ "./c.tsx": e("one", "nope") })).toThrow(/\.\/c\.tsx.*family/);
    expect(() => collectEntries({ "./d.tsx": { entry: { id: "one", family: "actions", specimens: [] } } })).toThrow(/\.\/d\.tsx.*specimens/);
  });
});

describe("rail and anchors", () => {
  it("groups by family and leaves empty families out", () => {
    const entries = collectEntries({ "./a.tsx": e("a", "patterns"), "./b.tsx": e("b", "foundations") });
    expect(railGroups(entries).map((g) => g.id)).toEqual(["foundations", "patterns"]);
    expect(FAMILIES.length).toBe(8);
  });
  it("builds anchors and serials", () => {
    expect(anchorId("colour")).toBe("styleguide-colour");
    expect(sheetSerial(6)).toBe("SG-07");
  });
});

describe("framesFor", () => {
  it("gives one frame, or dark then light", () => {
    expect(framesFor("light")).toEqual(["light"]);
    expect(framesFor("both")).toEqual(["dark", "light"]);
  });
});

describe("activeEntry", () => {
  const tops = [{ id: "a", top: -300 }, { id: "b", top: -20 }, { id: "c", top: 400 }];
  it("picks the last sheet whose top has reached the offset, else the first", () => {
    expect(activeEntry(tops, 0)).toBe("b");
    expect(activeEntry(tops, 500)).toBe("c");
    expect(activeEntry([{ id: "a", top: 90 }, { id: "b", top: 900 }], 10)).toBe("a");
    expect(activeEntry([], 0)).toBeNull();
  });
});

describe("contrast", () => {
  it("grades at 7, 4.5 and 3", () => {
    expect([8, 7, 5, 4.5, 3.5, 3, 2.9].map(contrastGrade)).toEqual(["AAA", "AAA", "AA", "AA", "AA large", "AA large", "Fail"]);
  });
  it("builds the pairs from the palette and skips non-hex values", () => {
    const pairs = contrastPairs({ text: "#000000", bg: "#ffffff", surface: "rgb(0 0 0)" });
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ fg: "text", bg: "bg", grade: "AAA" });
    expect(pairs[0].ratio).toBeCloseTo(21, 0);
  });
});
