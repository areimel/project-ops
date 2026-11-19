import { describe, expect, it } from "vitest";
import { homeRoute, leavesScreen, routerReducer, type Route } from "../renderer/shell/router";

const IDS = ["projects", "other"];
const home: Route = { view: "app", appId: "projects", recordId: null };

describe("routerReducer", () => {
  it("goes home (the first app) and to settings", () => {
    expect(routerReducer({ view: "settings" }, { type: "home" }, IDS)).toEqual(home);
    expect(routerReducer(home, { type: "settings" }, IDS)).toEqual({ view: "settings" });
    expect(homeRoute(IDS)).toEqual(home);
  });
  it("opens a known app, with or without a record", () => {
    expect(routerReducer(home, { type: "open", appId: "other" }, IDS)).toEqual({ view: "app", appId: "other", recordId: null });
    expect(routerReducer(home, { type: "open", appId: "projects", recordId: "abc" }, IDS)).toEqual({ view: "app", appId: "projects", recordId: "abc" });
  });
  it("sends an unknown app to the first app", () => {
    expect(routerReducer({ view: "settings" }, { type: "open", appId: "gone" }, IDS)).toEqual(home);
  });
  it("maps deep links, and unknown apps or missing ids go to the first app", () => {
    expect(routerReducer(home, { type: "deep-link", link: { view: "settings" } }, IDS)).toEqual({ view: "settings" });
    expect(routerReducer({ view: "settings" }, { type: "deep-link", link: { view: "home" } }, IDS)).toEqual(home);
    expect(routerReducer(home, { type: "deep-link", link: { view: "app", appId: "projects", recordId: "r1" } }, IDS))
      .toEqual({ view: "app", appId: "projects", recordId: "r1" });
    expect(routerReducer(home, { type: "deep-link", link: { view: "app", appId: "nope" } }, IDS)).toEqual(home);
    expect(routerReducer(home, { type: "deep-link", link: { view: "app" } }, IDS)).toEqual(home);
  });
});

describe("leavesScreen", () => {
  it("is false when the same app stays open (a deep link to another record)", () => {
    expect(leavesScreen(home, { ...home, recordId: "r2" })).toBe(false);
  });
  it("is true for another app or settings, and coming back from settings", () => {
    expect(leavesScreen(home, { view: "app", appId: "other", recordId: null })).toBe(true);
    expect(leavesScreen(home, { view: "settings" })).toBe(true);
    expect(leavesScreen({ view: "settings" }, home)).toBe(true);
  });
});
