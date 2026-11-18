import { describe, expect, it } from "vitest";
import { argvTargets, parseDeepLink } from "../../electron/features/deepLinkParse";

const ID = "0123456789abcdef";

describe("parseDeepLink", () => {
  it("parses the three forms", () => {
    expect(parseDeepLink("project-ops://home")).toEqual({ view: "home" });
    expect(parseDeepLink("project-ops://settings")).toEqual({ view: "settings" });
    expect(parseDeepLink("project-ops://open/notes")).toEqual({ view: "app", appId: "notes" });
    expect(parseDeepLink(`project-ops://open/notes/${ID}`)).toEqual({ view: "app", appId: "notes", recordId: ID });
  });
  it("accepts a trailing slash and any scheme case", () => {
    expect(parseDeepLink("PROJECT-OPS://open/tasks/")).toEqual({ view: "app", appId: "tasks" });
    expect(parseDeepLink("project-ops://home/")).toEqual({ view: "home" });
  });
  it("rejects other schemes and unknown hosts", () => {
    for (const u of ["https://open/notes", "other://open/notes", "project-ops://delete/notes", "project-ops://", "project-ops:open/notes", "", "notes"]) {
      expect(parseDeepLink(u)).toBeNull();
    }
  });
  it("rejects bad app ids and record ids", () => {
    for (const u of [
      "project-ops://open/", "project-ops://open/Notes", "project-ops://open/1notes", "project-ops://open/no_tes",
      `project-ops://open/${"a".repeat(33)}`, "project-ops://open/notes/xyz", `project-ops://open/notes/${ID}0`,
      "project-ops://open/%6eotes", "project-ops://open/../etc",
    ]) expect(parseDeepLink(u)).toBeNull();
  });
  it("rejects extra segments, queries, fragments and long input", () => {
    for (const u of [
      `project-ops://open/notes/${ID}/more`, "project-ops://home/x", "project-ops://settings/x",
      "project-ops://open/notes?x=1", "project-ops://open/notes#top", `project-ops://open/${"a".repeat(300)}`,
      "project-ops://open/notes ", "project-ops://open/no tes",
    ]) expect(parseDeepLink(u)).toBeNull();
  });
  it("never throws on non-strings", () => {
    expect(parseDeepLink(undefined as unknown as string)).toBeNull();
    expect(parseDeepLink(42 as unknown as string)).toBeNull();
  });
});

describe("argvTargets", () => {
  it("finds the first deep link, skipping flags and the executable", () => {
    const r = argvTargets(["/usr/bin/app", "--no-sandbox", "project-ops://open/editor", "project-ops://home"]);
    expect(r).toEqual({ link: { view: "app", appId: "editor" } });
  });
  it("ignores other arguments, including files and URL-shaped strings", () => {
    expect(argvTargets(["electron", ".", "/tmp/a.MD", "app.sh", "project-ops://bad"])).toEqual({ link: null });
    expect(argvTargets(["app", "file:///etc/passwd.txt", "https://a.example/b.md"])).toEqual({ link: null });
  });
  it("stops at a -- separator", () => {
    expect(argvTargets(["app", "--", "project-ops://home"])).toEqual({ link: null });
  });
});
