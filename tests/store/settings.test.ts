import { describe, expect, it } from "vitest";
import { SETTINGS_VERSION, classifySettingsFile, defaultSettings, healSettings, healSettingsPatch } from "../../shared/settings";

describe("defaultSettings", () => {
  it("matches the contract defaults", () => {
    expect(defaultSettings()).toEqual({
      theme: "kojima", mode: "dark", accent: null, closeToTray: false, editor: null, terminal: null,
    });
  });
});

describe("healSettings", () => {
  it("garbage gives defaults", () => {
    for (const raw of [undefined, null, 4, "x", [], {}]) expect(healSettings(raw)).toEqual(defaultSettings());
  });
  it("reads the stored envelope", () => {
    const raw = { version: SETTINGS_VERSION, values: { theme: "kojima", mode: "light", accent: "#AABBCC", closeToTray: true } };
    expect(healSettings(raw)).toEqual({
      theme: "kojima", mode: "light", accent: "#aabbcc", closeToTray: true, editor: null, terminal: null,
    });
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
  it("editor and terminal: a table id or null, anything else is dropped", () => {
    expect(healSettingsPatch({ editor: "zed", terminal: "kitty" })).toEqual({ editor: "zed", terminal: "kitty" });
    expect(healSettingsPatch({ editor: null, terminal: null })).toEqual({ editor: null, terminal: null });
    expect(healSettingsPatch({ editor: "kitty", terminal: "zed" })).toEqual({});
    expect(healSettingsPatch({ editor: "rm -rf /", terminal: 3 })).toEqual({});
  });
  it("an older file without editor and terminal heals them to null", () => {
    const s = healSettings({ version: 1, values: { theme: "kojima", mode: "light" } });
    expect(s.editor).toBeNull();
    expect(s.terminal).toBeNull();
    expect(healSettings({ version: 1, values: { editor: "vscode", terminal: "ghostty" } })).toMatchObject({ editor: "vscode", terminal: "ghostty" });
  });
  it("non-objects give an empty patch", () => {
    for (const raw of [undefined, null, 1, "x", []]) expect(healSettingsPatch(raw)).toEqual({});
  });
});
