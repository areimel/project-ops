import { describe, expect, it } from "vitest";
import { SETTINGS_VERSION, classifySettingsFile, defaultSettings, healSettings, healSettingsPatch } from "../../shared/settings";

describe("defaultSettings", () => {
  it("matches the contract defaults", () => {
    expect(defaultSettings()).toEqual({ theme: "kojima", mode: "dark", accent: null, closeToTray: false });
  });
});

describe("healSettings", () => {
  it("garbage gives defaults", () => {
    for (const raw of [undefined, null, 4, "x", [], {}]) expect(healSettings(raw)).toEqual(defaultSettings());
  });
  it("reads the stored envelope", () => {
    const raw = { version: SETTINGS_VERSION, values: { theme: "kojima", mode: "light", accent: "#AABBCC", closeToTray: true } };
    expect(healSettings(raw)).toEqual({ theme: "kojima", mode: "light", accent: "#aabbcc", closeToTray: true });
  });
  it("heals each key on its own and fills the rest", () => {
    expect(healSettings({ version: 1, values: { theme: "nope", mode: "light", accent: "red" } }))
      .toEqual({ ...defaultSettings(), mode: "light" });
  });
  it("an old theme id (blueprint, graphite, kraft) heals to kojima", () => {
    for (const theme of ["blueprint", "graphite", "kraft"]) {
      expect(healSettings({ version: 1, values: { theme, mode: "light" } })).toEqual({ ...defaultSettings(), theme: "kojima", mode: "light" });
    }
  });
  it("a wrong-version envelope gives defaults, a bad version too", () => {
    const values = { theme: "kojima", mode: "light" };
    expect(healSettings({ version: SETTINGS_VERSION + 1, values })).toEqual(defaultSettings());
    expect(healSettings({ version: "1", values })).toEqual(defaultSettings());
    expect(healSettings({ values })).toEqual(defaultSettings());
  });
  it("also accepts bare values (an import bundle)", () => {
    expect(healSettings({ theme: "kojima", mode: "light" }).mode).toBe("light");
  });
});

describe("classifySettingsFile", () => {
  it("tells usable, newer and damaged files apart", () => {
    expect(classifySettingsFile({ version: 1, values: { theme: "kojima" } })).toBe("ok");
    expect(classifySettingsFile({ theme: "kojima" })).toBe("ok");
    expect(classifySettingsFile({ version: SETTINGS_VERSION + 1, values: {} })).toBe("newer");
    for (const raw of [null, 4, "x", [], { version: 1 }, { values: {} }, { version: "1", values: {} }, { version: 1, values: 7 }]) {
      expect(classifySettingsFile(raw), JSON.stringify(raw)).toBe("damaged");
    }
  });
});

describe("healSettingsPatch", () => {
  it("keeps valid keys only", () => {
    expect(healSettingsPatch({ theme: "kojima", mode: "light", nope: 1, closeToTray: true })).toEqual({
      theme: "kojima", mode: "light", closeToTray: true,
    });
  });
  it("drops invalid values", () => {
    expect(healSettingsPatch({ theme: "x", mode: "auto", accent: "#12345", closeToTray: 1 })).toEqual({});
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
