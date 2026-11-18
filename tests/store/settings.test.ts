import { describe, expect, it } from "vitest";
import { SETTINGS_VERSION, classifySettingsFile, defaultSettings, healSettings, healSettingsPatch } from "../../shared/settings";

describe("defaultSettings", () => {
  it("matches the contract defaults", () => {
    expect(defaultSettings()).toEqual({ theme: "blueprint", mode: "system", accent: null, closeToTray: false, notifications: true });
  });
});

describe("healSettings", () => {
  it("garbage gives defaults", () => {
    for (const raw of [undefined, null, 4, "x", [], {}]) expect(healSettings(raw)).toEqual(defaultSettings());
  });
  it("reads the stored envelope", () => {
    const raw = { version: SETTINGS_VERSION, values: { theme: "kraft", mode: "dark", accent: "#AABBCC", closeToTray: true, notifications: false } };
    expect(healSettings(raw)).toEqual({ theme: "kraft", mode: "dark", accent: "#aabbcc", closeToTray: true, notifications: false });
  });
  it("heals each key on its own and fills the rest", () => {
    expect(healSettings({ version: 1, values: { theme: "nope", mode: "dark", accent: "red", notifications: "no" } }))
      .toEqual({ ...defaultSettings(), mode: "dark" });
  });
  it("a wrong-version envelope gives defaults, a bad version too", () => {
    const values = { theme: "kraft" };
    expect(healSettings({ version: SETTINGS_VERSION + 1, values })).toEqual(defaultSettings());
    expect(healSettings({ version: "1", values })).toEqual(defaultSettings());
    expect(healSettings({ values })).toEqual(defaultSettings());
  });
  it("also accepts bare values (an import bundle)", () => {
    expect(healSettings({ theme: "graphite" }).theme).toBe("graphite");
  });
});

describe("classifySettingsFile", () => {
  it("tells usable, newer and damaged files apart", () => {
    expect(classifySettingsFile({ version: 1, values: { theme: "kraft" } })).toBe("ok");
    expect(classifySettingsFile({ theme: "kraft" })).toBe("ok");
    expect(classifySettingsFile({ version: SETTINGS_VERSION + 1, values: {} })).toBe("newer");
    for (const raw of [null, 4, "x", [], { version: 1 }, { values: {} }, { version: "1", values: {} }, { version: 1, values: 7 }]) {
      expect(classifySettingsFile(raw), JSON.stringify(raw)).toBe("damaged");
    }
  });
});

describe("healSettingsPatch", () => {
  it("keeps valid keys only", () => {
    expect(healSettingsPatch({ theme: "graphite", mode: "light", nope: 1, closeToTray: true })).toEqual({
      theme: "graphite", mode: "light", closeToTray: true,
    });
  });
  it("drops invalid values", () => {
    expect(healSettingsPatch({ theme: "x", mode: "auto", accent: "#12345", closeToTray: 1, notifications: "true" })).toEqual({});
  });
  it("accent: valid hex is lower-cased, null clears, anything else is dropped", () => {
    expect(healSettingsPatch({ accent: "#ABCDEF" })).toEqual({ accent: "#abcdef" });
    expect(healSettingsPatch({ accent: null })).toEqual({ accent: null });
    expect(healSettingsPatch({ accent: "#abc" })).toEqual({});
    expect(healSettingsPatch({ accent: "javascript:1" })).toEqual({});
  });
  it("non-objects give an empty patch", () => {
    for (const raw of [undefined, null, 1, "x", []]) expect(healSettingsPatch(raw)).toEqual({});
  });
});
