import { describe, expect, it } from "vitest";
import { nextMode, stateTone, titleBlockModel } from "../renderer/shell/shellModel";

describe("nextMode", () => {
  it("cycles system, light, dark", () => {
    expect(nextMode("system")).toBe("light");
    expect(nextMode("light")).toBe("dark");
    expect(nextMode("dark")).toBe("system");
  });
});

describe("titleBlockModel", () => {
  const app = { view: "app", appId: "projects", recordId: null } as const;
  it("shows brand, view, count and the version when the app reports no save state", () => {
    const m = titleBlockModel(app, "Brand", "Projects", { count: "42 projects" }, "1.2.3");
    expect(m).toMatchObject({ name: "Brand", view: "Projects", count: "42 projects", state: { label: "Version 1.2.3", tone: "plain" } });
  });
  it("shows the save state in place of the version", () => {
    const m = titleBlockModel(app, "Brand", "Projects", { saveState: "unsaved" }, "1");
    expect(m.state).toEqual({ label: "Unsaved changes", tone: "unsaved" });
  });
  it("omits the count when the app reports none", () => {
    expect(titleBlockModel(app, "Brand", "Projects", {}, "1").count).toBeUndefined();
  });
  it("labels settings and ignores a leftover count", () => {
    const m = titleBlockModel({ view: "settings" }, "Brand", "Settings", { count: "42 projects" }, "1");
    expect(m).toEqual({ name: "Brand", view: "Settings", state: { label: "Version 1", tone: "plain" } });
  });
});

describe("stateTone", () => {
  it("paints a saved state green, a failure red and everything else muted", () => {
    expect(stateTone("saved")).toBe("success");
    expect(stateTone("error")).toBe("danger");
    for (const t of ["saving", "unsaved", "plain"] as const) expect(stateTone(t)).toBe("muted");
  });
});
