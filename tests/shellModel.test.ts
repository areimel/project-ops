import { describe, expect, it } from "vitest";
import { nextMode, nextSheetIndex, sheetNumber, titleBlockModel } from "../renderer/shell/shellModel";

describe("nextMode", () => {
  it("cycles system, light, dark", () => {
    expect(nextMode("system")).toBe("light");
    expect(nextMode("light")).toBe("dark");
    expect(nextMode("dark")).toBe("system");
  });
});

describe("titleBlockModel", () => {
  const app = { view: "app", appId: "notes", recordId: null } as const;
  it("says Index and the sheet count on home", () => {
    const m = titleBlockModel({ view: "home" }, "Brand", 8, -1, {}, "1.2.3");
    expect(m).toMatchObject({ name: "Brand", sheet: "Index", count: "8 sheets" });
    expect(m.state?.label).toBe("Version 1.2.3");
  });
  it("numbers the sheet from the registry position and carries count and save state", () => {
    const m = titleBlockModel(app, "Brand", 8, 2, { count: "12 notes", saveState: "unsaved" }, "1");
    expect(m).toMatchObject({ sheet: "Sheet 3 of 8", count: "12 notes", state: { label: "Unsaved changes", tone: "unsaved" } });
  });
  it("omits count and state when the app reports none", () => {
    const m = titleBlockModel(app, "Brand", 8, 0, {}, "1");
    expect(m.count).toBeUndefined();
    expect(m.state).toBeUndefined();
  });
  it("labels settings", () => {
    expect(titleBlockModel({ view: "settings" }, "Brand", 8, -1, {}, "1").sheet).toBe("Settings");
  });
});

describe("sheet index keys", () => {
  it("pads sheet numbers", () => { expect(sheetNumber(0)).toBe("01"); expect(sheetNumber(9)).toBe("10"); });
  it("steps without wrapping", () => {
    expect(nextSheetIndex(0, "ArrowDown", 8)).toBe(1);
    expect(nextSheetIndex(7, "ArrowDown", 8)).toBe(7);
    expect(nextSheetIndex(0, "ArrowUp", 8)).toBe(0);
    expect(nextSheetIndex(3, "Home", 8)).toBe(0);
    expect(nextSheetIndex(3, "End", 8)).toBe(7);
  });
  it("jumps to a digit when that sheet exists", () => {
    expect(nextSheetIndex(0, "3", 8)).toBe(2);
    expect(nextSheetIndex(0, "9", 8)).toBeNull();
    expect(nextSheetIndex(0, "0", 8)).toBeNull();
  });
  it("ignores other keys and an empty list", () => {
    expect(nextSheetIndex(0, "a", 8)).toBeNull();
    expect(nextSheetIndex(0, "ArrowDown", 0)).toBeNull();
  });
});
