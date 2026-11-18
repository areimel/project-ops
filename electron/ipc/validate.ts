import { COLLECTIONS, type CollectionName } from "../../shared/collections";
import { isRecordId } from "../../shared/collections/base";
import type { Check } from "./handle";

/** Thrown by every check. `handle` passes the message on to the renderer as plain text. */
export class IpcArgError extends Error {
  constructor(at: string, expected: string) {
    super(`Invalid argument ${at}: expected ${expected}`);
    this.name = "IpcArgError";
  }
}

const bad = (at: string, expected: string): never => { throw new IpcArgError(at, expected); };

export const v: {
  none: (a: unknown[]) => [];
  args<T extends unknown[]>(...checks: { [K in keyof T]: Check<T[K]> }): (a: unknown[]) => T;
  string(o?: { min?: number; max?: number; pattern?: RegExp }): Check<string>;  // default max 10_000
  /** A string as above, with every line break and control character replaced by a space: safe to put in a one-line log. */
  line(o?: { max?: number }): Check<string>;
  int(min: number, max: number): Check<number>;
  bool: Check<boolean>;
  oneOf<T extends string>(values: readonly T[]): Check<T>;
  nullable<T>(c: Check<T>): Check<T | null>;
  /** A plain object with exactly these fields, each checked. Other keys are dropped from the result. */
  object<S extends Record<string, Check<unknown>>>(shape: S): Check<{ [K in keyof S]: ReturnType<S[K]> }>;
  recordId: Check<string>;            // isRecordId
  collection: Check<CollectionName>;  // key of COLLECTIONS
  raw: Check<unknown>;                // only for payloads that go straight into a heal()
} = {
  none: (a) => {
    if (a.length !== 0) bad("list", "no arguments");
    return [];
  },
  args: <T extends unknown[]>(...checks: { [K in keyof T]: Check<T[K]> }) => (a: unknown[]): T => {
    const list = checks as unknown as Check<unknown>[];
    if (!Array.isArray(a) || a.length > list.length) bad("list", `at most ${list.length} arguments`);
    return list.map((check, i) => check(a[i], `#${i + 1}`)) as T;
  },
  string: (o = {}) => (x, at) => {
    const { min = 0, max = 10_000, pattern } = o;
    if (typeof x !== "string") return bad(at, "a string");
    if (x.length < min || x.length > max) return bad(at, `a string of ${min} to ${max} characters`);
    if (pattern && !pattern.test(x)) return bad(at, "a string in the expected format");
    return x;
  },
  line: (o = {}) => (x, at) => {
    const text = v.string({ max: o.max })(x, at);
    return text.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, " ");
  },
  int: (min, max) => (x, at) => {
    if (typeof x !== "number" || !Number.isInteger(x) || x < min || x > max) return bad(at, `an integer from ${min} to ${max}`);
    return x;
  },
  bool: (x, at) => (typeof x === "boolean" ? x : bad(at, "a boolean")),
  oneOf: <T extends string>(values: readonly T[]): Check<T> => (x, at) =>
    typeof x === "string" && (values as readonly string[]).includes(x) ? (x as T) : bad(at, `one of ${values.join(", ")}`),
  nullable: (c) => (x, at) => (x === null ? null : c(x, at)),
  object: <S extends Record<string, Check<unknown>>>(shape: S): Check<{ [K in keyof S]: ReturnType<S[K]> }> => (x, at) => {
    if (typeof x !== "object" || x === null || Array.isArray(x)) return bad(at, `an object with ${Object.keys(shape).join(", ")}`);
    const o = x as Record<string, unknown>;
    return Object.fromEntries(Object.entries(shape).map(([k, check]) => [k, check(o[k], `${at}.${k}`)])) as { [K in keyof S]: ReturnType<S[K]> };
  },
  recordId: (x, at) => (isRecordId(x) ? x : bad(at, "a record id")),
  collection: (x, at) =>
    typeof x === "string" && Object.hasOwn(COLLECTIONS, x) ? (x as CollectionName) : bad(at, "a collection name"),
  raw: (x) => x,
};
