import { describe, expect, it } from "vitest";
import { IpcArgError, v } from "../electron/ipc/validate";

const at = "#1";

describe("v checks", () => {
  it("string: type, length and pattern", () => {
    expect(v.string()("ok", at)).toBe("ok");
    expect(() => v.string()(4, at)).toThrow(IpcArgError);
    expect(() => v.string()("x".repeat(10_001), at)).toThrow(/#1/);
    expect(() => v.string({ min: 1 })("", at)).toThrow(IpcArgError);
    expect(() => v.string({ pattern: /^a+$/ })("b", at)).toThrow(IpcArgError);
    expect(v.string({ max: 3 })("abc", at)).toBe("abc");
  });
  it("line: replaces line breaks and control characters so a log line cannot be forged", () => {
    expect(v.line()("a\r\n2026-01-01 ERROR [main] forged\u0000\u001b[31m\u2028x", at)).toBe("a  2026-01-01 ERROR [main] forged  [31m x");
    expect(v.line({ max: 3 })("abc", at)).toBe("abc");
    expect(() => v.line({ max: 3 })("abcd", at)).toThrow(IpcArgError);
    expect(() => v.line()(4, at)).toThrow(IpcArgError);
  });
  it("int: integers in range only", () => {
    expect(v.int(1, 5)(3, at)).toBe(3);
    for (const x of [0, 6, 1.5, NaN, Infinity, "3", null]) expect(() => v.int(1, 5)(x, at)).toThrow(IpcArgError);
  });
  it("bool and oneOf", () => {
    expect(v.bool(true, at)).toBe(true);
    expect(() => v.bool(1, at)).toThrow(IpcArgError);
    expect(v.oneOf(["a", "b"] as const)("b", at)).toBe("b");
    expect(() => v.oneOf(["a", "b"] as const)("c", at)).toThrow(IpcArgError);
    expect(() => v.oneOf(["a"] as const)(["a"], at)).toThrow(IpcArgError);
  });
  it("nullable passes null through and checks the rest", () => {
    expect(v.nullable(v.int(0, 9))(null, at)).toBeNull();
    expect(v.nullable(v.int(0, 9))(4, at)).toBe(4);
    expect(() => v.nullable(v.int(0, 9))("4", at)).toThrow(IpcArgError);
  });
  it("object: checks each field, names it, and drops other keys", () => {
    const check = v.object({ n: v.int(1, 5), label: v.string({ max: 3 }) });
    expect(check({ n: 2, label: "ab", extra: true }, at)).toEqual({ n: 2, label: "ab" });
    expect(() => check({ n: 9, label: "ab" }, at)).toThrow(/#1\.n/);
    expect(() => check({ n: 2 }, at)).toThrow(/#1\.label/);
    for (const x of [null, undefined, "x", 4, [1, 2]]) expect(() => check(x, at)).toThrow(IpcArgError);
  });
  it("recordId: 16 lowercase hex", () => {
    expect(v.recordId("0123456789abcdef", at)).toBe("0123456789abcdef");
    for (const x of ["0123456789ABCDEF", "short", "0123456789abcdef0", 5, undefined]) {
      expect(() => v.recordId(x, at)).toThrow(IpcArgError);
    }
  });
  it("collection: allowlisted names only, no prototype keys", () => {
    expect(v.collection("notes", at)).toBe("notes");
    for (const x of ["settings", "constructor", "__proto__", "toString", "", 1]) {
      expect(() => v.collection(x, at)).toThrow(IpcArgError);
    }
  });
  it("raw passes anything", () => {
    const o = {};
    expect(v.raw(o, at)).toBe(o);
  });
});

describe("v.args and v.none", () => {
  const check = v.args(v.collection, v.recordId, v.raw);
  it("returns checked values and numbers the failing position", () => {
    expect(check(["tasks", "0123456789abcdef", { a: 1 }])).toEqual(["tasks", "0123456789abcdef", { a: 1 }]);
    expect(() => check(["tasks", "nope", 1])).toThrow(/#2/);
  });
  it("refuses extra arguments", () => {
    expect(() => check(["tasks", "0123456789abcdef", 1, 2])).toThrow(IpcArgError);
  });
  it("missing arguments are checked as undefined", () => {
    expect(() => check(["tasks"])).toThrow(/#2/);
  });
  it("none accepts only an empty list", () => {
    expect(v.none([])).toEqual([]);
    expect(() => v.none([1])).toThrow(IpcArgError);
  });
});
