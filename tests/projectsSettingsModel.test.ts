import { describe, expect, it } from "vitest";
import { AUTO, launcherChoices, projectCountLabel, scanSummary, settingFromValue } from "../renderer/settings/projectsSettingsModel";

describe("launcherChoices", () => {
  it("lists automatic first, then the platform's entries", () => {
    const c = launcherChoices("terminal", "win32", [], null);
    expect(c.options.map((o) => o.value)).toEqual([AUTO, "alacritty", "wezterm", "windows-terminal"]);
  });
  it("names the first installed program in the automatic label", () => {
    const c = launcherChoices("editor", "linux", ["cursor", "zed"], null);
    expect(c.options[0].label).toBe("Automatic (Cursor)");
    expect(c.buttonText).toBe("Automatic (Cursor)");
  });
  it("marks entries that are not installed but keeps them selectable", () => {
    const c = launcherChoices("editor", "linux", ["zed"], null);
    expect(c.options.find((o) => o.value === "vscode")?.label).toBe("VS Code (not found)");
    expect(c.options.find((o) => o.value === "zed")?.label).toBe("Zed");
  });
  it("says none found when nothing is installed", () => {
    expect(launcherChoices("editor", "linux", [], null).options[0].label).toBe("Automatic (none found)");
  });
  it("does not mark anything before the installed list is known", () => {
    const c = launcherChoices("editor", "linux", null, null);
    expect(c.options[0].label).toBe("Automatic (first installed)");
    expect(c.options.some((o) => o.label.includes("not found"))).toBe(false);
  });
  it("selects the stored id, or automatic for null and for ids this platform lacks", () => {
    expect(launcherChoices("editor", "linux", ["zed"], "zed").selected).toBe("zed");
    expect(launcherChoices("editor", "linux", ["zed"], "zed").buttonText).toBe("Zed");
    expect(launcherChoices("terminal", "linux", [], null).selected).toBe(AUTO);
    expect(launcherChoices("terminal", "linux", [], "windows-terminal").selected).toBe(AUTO);
  });
});

describe("settingFromValue", () => {
  it("maps automatic to null", () => {
    expect(settingFromValue(AUTO)).toBeNull();
    expect(settingFromValue("zed")).toBe("zed");
  });
});

describe("scanSummary", () => {
  it("reports new projects", () => {
    expect(scanSummary({ added: 3, missing: 0 })).toBe("Found 3 new projects");
    expect(scanSummary({ added: 1, missing: 0 })).toBe("Found 1 new project");
  });
  it("reports none, and newly missing ones", () => {
    expect(scanSummary({ added: 0, missing: 0 })).toBe("No new projects");
    expect(scanSummary({ added: 0, missing: 2 })).toBe("No new projects. 2 projects are no longer on disk.");
    expect(scanSummary({ added: 2, missing: 1 })).toBe("Found 2 new projects. 1 project is no longer on disk.");
  });
});

describe("projectCountLabel", () => {
  it("pluralises", () => {
    expect(projectCountLabel(0)).toBe("0 projects");
    expect(projectCountLabel(1)).toBe("1 project");
  });
});
