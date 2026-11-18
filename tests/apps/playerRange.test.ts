import { describe, expect, it } from "vitest";
import { parseRange } from "../../electron/features/mediaRange";

describe("parseRange", () => {
  it("sends the whole file when there is no usable Range header", () => {
    for (const h of [null, "", "bytes=", "bytes=-", "items=0-5", "bytes=0-1,5-6", "bytes=a-b", "bytes=1-2-3", "bytes=5-2", "0-5"]) {
      expect(parseRange(h, 100), String(h)).toBeNull();
    }
  });

  it("parses a closed range", () => {
    expect(parseRange("bytes=0-9", 100)).toEqual({ start: 0, end: 9 });
    expect(parseRange("bytes=10-10", 100)).toEqual({ start: 10, end: 10 });
  });

  it("parses an open-ended range, which is what a <video> sends first", () => {
    expect(parseRange("bytes=0-", 100)).toEqual({ start: 0, end: 99 });
    expect(parseRange("bytes=40-", 100)).toEqual({ start: 40, end: 99 });
  });

  it("parses a suffix range", () => {
    expect(parseRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange("bytes=-500", 100)).toEqual({ start: 0, end: 99 });
  });

  it("clamps an end past the file", () => {
    expect(parseRange("bytes=90-500", 100)).toEqual({ start: 90, end: 99 });
  });

  it("answers 416 for a start at or past the end, a zero suffix, or an empty file", () => {
    expect(parseRange("bytes=100-", 100)).toBe("unsatisfiable");
    expect(parseRange("bytes=100-200", 100)).toBe("unsatisfiable");
    expect(parseRange("bytes=-0", 100)).toBe("unsatisfiable");
    expect(parseRange("bytes=0-5", 0)).toBe("unsatisfiable");
  });

  it("tolerates surrounding spaces and does not overflow on huge numbers", () => {
    expect(parseRange(" bytes=1-2 ", 100)).toEqual({ start: 1, end: 2 });
    expect(parseRange("bytes=99999999999999999999-", 100)).toBe("unsatisfiable");
  });
});
