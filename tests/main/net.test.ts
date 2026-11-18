import { describe, expect, it } from "vitest";
import { NET_HOSTS, NetError, isAllowedUrl, parseBody, readCapped, toNetError } from "../../electron/features/netCore";

const stream = (...parts: string[]): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(c) { for (const p of parts) c.enqueue(new TextEncoder().encode(p)); c.close(); },
  });

describe("isAllowedUrl", () => {
  it("allows https on allowlisted hosts", () => {
    for (const h of NET_HOSTS) expect(isAllowedUrl(`https://${h}/v0/topstories.json`)).toBe(true);
  });
  it("blocks http, other hosts, lookalikes, credentials and odd ports", () => {
    for (const u of [
      "http://hacker-news.firebaseio.com/v0/x.json", "https://example.com/", "https://hacker-news.firebaseio.com.evil.com/",
      "https://evil.com/hacker-news.firebaseio.com", "https://user:pw@hacker-news.firebaseio.com/", "https://hacker-news.firebaseio.com:8443/",
      "ftp://hacker-news.firebaseio.com/", "file:///etc/passwd", "javascript:alert(1)", "not a url", "",
    ]) expect(isAllowedUrl(u), u).toBe(false);
  });
});

describe("readCapped", () => {
  it("reads a whole body under the cap", async () => {
    expect(await readCapped(stream("{\"a\":", "1}"), 100)).toBe("{\"a\":1}");
    expect(await readCapped(null, 10)).toBe("");
  });
  it("refuses a body over the cap", async () => {
    await expect(readCapped(stream("x".repeat(60), "x".repeat(60)), 100)).rejects.toMatchObject({ kind: "parse" });
  });
});

describe("parseBody", () => {
  it("returns the healed value", () => {
    expect(parseBody("[1,2]", (r) => (r as number[]).length)).toBe(2);
  });
  it("turns bad JSON and heal failures into NetError parse, without leaking the raw error", () => {
    for (const run of [() => parseBody("{nope", (r) => r), () => parseBody("1", () => { throw new TypeError("secret detail"); })]) {
      try { run(); expect.unreachable(); } catch (e) {
        expect(e).toBeInstanceOf(NetError);
        expect((e as NetError).kind).toBe("parse");
        expect((e as NetError).message).not.toMatch(/secret|Unexpected/);
      }
    }
  });
});

describe("toNetError", () => {
  it("classifies without exposing the original message", () => {
    expect(toNetError(new TypeError("net::ERR_NAME_NOT_RESOLVED"), false)).toMatchObject({ kind: "offline", message: "Could not reach the server" });
    expect(toNetError(new Error("aborted"), true).kind).toBe("timeout");
    const own = new NetError("http", "The server answered with status 503");
    expect(toNetError(own, true)).toBe(own);
  });
});
