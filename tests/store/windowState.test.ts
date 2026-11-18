import { describe, expect, it } from "vitest";
import { fitToDisplays, healWindowState, type Rect } from "../../electron/store/windowStateShape";

const screen1: Rect = { x: 0, y: 0, width: 1920, height: 1080 };
const screen2: Rect = { x: 1920, y: 0, width: 1280, height: 1024 };

describe("healWindowState", () => {
  it("garbage gives no bounds", () => {
    for (const raw of [undefined, null, 3, "x", [], {}, { bounds: 5 }, { bounds: { width: "a", height: 1 } }]) {
      expect(healWindowState(raw)).toEqual({ bounds: null, maximized: false });
    }
  });
  it("keeps valid bounds, rounds them, and the maximised flag", () => {
    expect(healWindowState({ bounds: { x: 10.4, y: 20, width: 800.6, height: 600 }, maximized: true }))
      .toEqual({ bounds: { x: 10, y: 20, width: 801, height: 600 }, maximized: true });
  });
  it("drops a bad position but keeps the size", () => {
    expect(healWindowState({ bounds: { x: "a", y: 1, width: 800, height: 600 } }).bounds).toEqual({ width: 800, height: 600 });
    expect(healWindowState({ bounds: { x: NaN, y: 1, width: 800, height: 600 } }).bounds).toEqual({ width: 800, height: 600 });
  });
  it("rejects absurd sizes", () => {
    expect(healWindowState({ bounds: { width: 0, height: 600 } }).bounds).toBeNull();
    expect(healWindowState({ bounds: { width: 1e9, height: 600 } }).bounds).toBeNull();
  });
  it("maximized must be exactly true", () => {
    expect(healWindowState({ maximized: "true" }).maximized).toBe(false);
  });
});

describe("fitToDisplays", () => {
  const at = (x: number, y: number, width = 1000, height = 700) => ({ bounds: { x, y, width, height }, maximized: false });

  it("leaves a window on a display alone", () => {
    expect(fitToDisplays(at(100, 100), [screen1])).toEqual(at(100, 100));
  });
  it("null bounds stay null", () => {
    expect(fitToDisplays({ bounds: null, maximized: true }, [screen1])).toEqual({ bounds: null, maximized: true });
  });
  it("drops x/y when the window is off every display (a removed monitor)", () => {
    expect(fitToDisplays(at(5000, 100), [screen1]).bounds).toEqual({ width: 1000, height: 700 });
    expect(fitToDisplays(at(-3000, -3000), [screen1, screen2]).bounds).toEqual({ width: 1000, height: 700 });
  });
  it("a window barely touching a display counts as off it", () => {
    expect(fitToDisplays(at(1900, 100), [screen1]).bounds?.x).toBeUndefined();
  });
  it("finds the second display", () => {
    expect(fitToDisplays(at(2000, 50), [screen1, screen2]).bounds).toEqual({ x: 2000, y: 50, width: 1000, height: 700 });
  });
  it("pulls a window that sticks out of its display back inside", () => {
    expect(fitToDisplays(at(1500, 600), [screen1]).bounds).toEqual({ x: 920, y: 380, width: 1000, height: 700 });
  });
  it("shrinks a window larger than its display", () => {
    expect(fitToDisplays(at(0, 0, 4000, 3000), [screen1]).bounds).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
  });
  it("enforces 720x480 minimum, even over a small display", () => {
    expect(fitToDisplays(at(0, 0, 300, 200), [screen1]).bounds).toEqual({ x: 0, y: 0, width: 720, height: 480 });
    expect(fitToDisplays(at(0, 0, 900, 900), [{ x: 0, y: 0, width: 600, height: 400 }]).bounds?.width).toBe(720);
  });
  it("size without position gets only the size fitted", () => {
    expect(fitToDisplays({ bounds: { width: 5000, height: 100 }, maximized: false }, [screen1]).bounds)
      .toEqual({ width: 1920, height: 480 });
  });
  it("with no displays known, applies the minimum and nothing else", () => {
    expect(fitToDisplays(at(10, 10, 300, 300), []).bounds).toEqual({ x: 10, y: 10, width: 720, height: 480 });
  });
});
