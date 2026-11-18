import { describe, expect, it } from "vitest";
import { leavesSheet, routerReducer, type Route } from "../renderer/shell/router";

const IDS = ["notes", "tasks"];
const home: Route = { view: "home" };

describe("routerReducer", () => {
  it("goes home and to settings", () => {
    expect(routerReducer({ view: "settings" }, { type: "home" }, IDS)).toEqual(home);
    expect(routerReducer(home, { type: "settings" }, IDS)).toEqual({ view: "settings" });
  });
  it("opens a known app, with or without a record", () => {
    expect(routerReducer(home, { type: "open", appId: "notes" }, IDS)).toEqual({ view: "app", appId: "notes", recordId: null });
    expect(routerReducer(home, { type: "open", appId: "tasks", recordId: "abc" }, IDS)).toEqual({ view: "app", appId: "tasks", recordId: "abc" });
  });
  it("sends an unknown app home", () => {
    expect(routerReducer({ view: "settings" }, { type: "open", appId: "gone" }, IDS)).toEqual(home);
  });
  it("maps deep links, and unknown apps or missing ids go home", () => {
    expect(routerReducer(home, { type: "deep-link", link: { view: "settings" } }, IDS)).toEqual({ view: "settings" });
    expect(routerReducer({ view: "settings" }, { type: "deep-link", link: { view: "home" } }, IDS)).toEqual(home);
    expect(routerReducer(home, { type: "deep-link", link: { view: "app", appId: "notes", recordId: "r1" } }, IDS))
      .toEqual({ view: "app", appId: "notes", recordId: "r1" });
    expect(routerReducer(home, { type: "deep-link", link: { view: "app", appId: "nope" } }, IDS)).toEqual(home);
    expect(routerReducer(home, { type: "deep-link", link: { view: "app" } }, IDS)).toEqual(home);
  });
});

describe("leavesSheet", () => {
  const notes: Route = { view: "app", appId: "notes", recordId: null };
  it("is false when the same app stays open (a deep link to another record)", () => {
    expect(leavesSheet(notes, { ...notes, recordId: "r2" })).toBe(false);
  });
  it("is true for another app, home or settings", () => {
    expect(leavesSheet(notes, { view: "app", appId: "tasks", recordId: null })).toBe(true);
    expect(leavesSheet(notes, home)).toBe(true);
    expect(leavesSheet(home, { view: "settings" })).toBe(true);
  });
});
