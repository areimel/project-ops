import { describe, expect, it } from "vitest";
import { argvTargets, parseDeepLink } from "../../electron/features/deepLinkParse";

const ID = "0123456789abcdef";

describe("parseDeepLink", () => {
  it("parses the three forms", () => {
    expect(parseDeepLink("app-template://home")).toEqual({ view: "home" });
    expect(parseDeepLink("app-template://settings")).toEqual({ view: "settings" });
    expect(parseDeepLink("app-template://open/notes")).toEqual({ view: "app", appId: "notes" });
    expect(parseDeepLink(`app-template://open/notes/${ID}`)).toEqual({ view: "app", appId: "notes", recordId: ID });
  });
  it("accepts a trailing slash and any scheme case", () => {
    expect(parseDeepLink("APP-TEMPLATE://open/tasks/")).toEqual({ view: "app", appId: "tasks" });
    expect(parseDeepLink("app-template://home/")).toEqual({ view: "home" });
  });
  it("rejects other schemes and unknown hosts", () => {
    for (const u of ["https://open/notes", "other://open/notes", "app-template://delete/notes", "app-template://", "app-template:open/notes", "", "notes"]) {
      expect(parseDeepLink(u)).toBeNull();
    }
  });
  it("rejects bad app ids and record ids", () => {
    for (const u of [
      "app-template://open/", "app-template://open/Notes", "app-template://open/1notes", "app-template://open/no_tes",
      `app-template://open/${"a".repeat(33)}`, "app-template://open/notes/xyz", `app-template://open/notes/${ID}0`,
      "app-template://open/%6eotes", "app-template://open/../etc",
    ]) expect(parseDeepLink(u)).toBeNull();
  });
  it("rejects extra segments, queries, fragments and long input", () => {
    for (const u of [
      `app-template://open/notes/${ID}/more`, "app-template://home/x", "app-template://settings/x",
      "app-template://open/notes?x=1", "app-template://open/notes#top", `app-template://open/${"a".repeat(300)}`,
      "app-template://open/notes ", "app-template://open/no tes",
    ]) expect(parseDeepLink(u)).toBeNull();
  });
  it("never throws on non-strings", () => {
    expect(parseDeepLink(undefined as unknown as string)).toBeNull();
    expect(parseDeepLink(42 as unknown as string)).toBeNull();
  });
});

describe("argvTargets", () => {
  it("finds the first deep link and text file, skipping flags and the executable", () => {
    const r = argvTargets(["/usr/bin/app", "--no-sandbox", "app-template://open/editor", "notes.md", "b.txt"], "/home/u");
    expect(r).toEqual({ link: { view: "app", appId: "editor" }, file: "/home/u/notes.md" });
  });
  it("keeps absolute paths and ignores other arguments", () => {
    expect(argvTargets(["electron", ".", "/tmp/a.MD"], "/x")).toEqual({ link: null, file: "/tmp/a.MD" });
    expect(argvTargets(["electron", ".", "app.sh", "app-template://bad"], "/x")).toEqual({ link: null, file: null });
  });
  it("never takes a URL-shaped argument as a file", () => {
    expect(argvTargets(["app", "app-template://open/../../etc/x.md"], "/x")).toEqual({ link: null, file: null });
    expect(argvTargets(["app", "file:///etc/passwd.txt", "https://a.example/b.md", "other:thing.md"], "/x")).toEqual({ link: null, file: null });
  });
  it("stops at a -- separator", () => {
    expect(argvTargets(["app", "--", "a.md"], "/x")).toEqual({ link: null, file: null });
  });
});
