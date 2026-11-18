import { describe, expect, it } from "vitest";
import { childEnv, launchError, onPath, resolveLauncher } from "../../electron/features/launchCore";

describe("childEnv", () => {
  it("restores the desktop variable and drops the ORIGINAL_ key", () => {
    const out = childEnv({ XDG_CURRENT_DESKTOP: "wrapped", ORIGINAL_XDG_CURRENT_DESKTOP: "GNOME", HOME: "/h" });
    expect(out).toEqual({ XDG_CURRENT_DESKTOP: "GNOME", HOME: "/h" });
  });
  it("keeps the desktop variable when there is no original", () => {
    expect(childEnv({ XDG_CURRENT_DESKTOP: "KDE" })).toEqual({ XDG_CURRENT_DESKTOP: "KDE" });
  });
  it("strips Electron, Vite and app variables", () => {
    const out = childEnv({
      ELECTRON_RUN_AS_NODE: "1", VITE_DEV_SERVER_URL: "x", CHROME_DESKTOP: "a.desktop", NODE_OPTIONS: "--x",
      APP_CAPTURE: "/o.png", APP_LAUNCH_DRY: "1", PATH: "/bin", APPDATA: "keep",
    });
    expect(out).toEqual({ PATH: "/bin", APPDATA: "keep" });
  });
  it("does not mutate its input", () => {
    const input = { ELECTRON_X: "1", ORIGINAL_XDG_CURRENT_DESKTOP: "GNOME", XDG_CURRENT_DESKTOP: "w" };
    const copy = { ...input };
    childEnv(input);
    expect(input).toEqual(copy);
  });
});

describe("onPath", () => {
  const has = (...files: string[]) => (f: string) => files.includes(f);
  it("finds a command in the second PATH folder", () => {
    expect(onPath("code", "/a:/b", has("/b/code"), "linux")).toBe(true);
  });
  it("reports a missing command", () => {
    expect(onPath("code", "/a:/b", has("/c/code"), "linux")).toBe(false);
    expect(onPath("code", "", has("/code"), "linux")).toBe(false);
  });
  it("rejects a command with a path separator", () => {
    expect(onPath("/bin/sh", "/bin", has("/bin//bin/sh", "/bin/sh"), "linux")).toBe(false);
    expect(onPath("../x", "/a", has("/a/../x"), "linux")).toBe(false);
    expect(onPath("a\\b", "C:\\x", () => true, "win32")).toBe(false);
  });
  it("tries PATHEXT on win32", () => {
    const exists = has("C:\\bin\\code.CMD".toLowerCase());
    expect(onPath("code", "C:\\a;C:\\bin", (f) => exists(f.toLowerCase()), "win32", ".EXE;.CMD")).toBe(true);
    expect(onPath("code", "C:\\bin", () => false, "win32", ".EXE;.CMD")).toBe(false);
  });
  it("uses a command that already has an extension as is on win32", () => {
    const seen: string[] = [];
    const found = onPath("code.cmd", "C:\\bin", (f) => { seen.push(f); return f === "C:\\bin\\code.cmd"; }, "win32", ".EXE;.CMD");
    expect(found).toBe(true);
    expect(seen).toEqual(["C:\\bin\\code.cmd"]);
  });
});

describe("launchError", () => {
  it("words the common codes", () => {
    expect(launchError("VS Code", "ENOENT")).toBe("VS Code was not found. Choose another in Settings.");
    expect(launchError("Zed", "EACCES")).toContain("permission denied");
    expect(launchError("Zed", undefined)).toBe("Zed could not be started. Choose another in Settings.");
  });
});

describe("resolveLauncher", () => {
  it("prefers a valid preferred id, even when not installed", () => {
    expect(resolveLauncher("editor", "zed", ["vscode"])).toBe("zed");
  });
  it("falls back to the first installed in table order when the preference is invalid", () => {
    expect(resolveLauncher("editor", "nope", ["zed", "vscode"])).toBe("vscode");
    expect(resolveLauncher("editor", 42, ["zed"])).toBe("zed");
    expect(resolveLauncher("terminal", "zed", ["kitty", "konsole"])).toBe("konsole");
  });
  it("returns null when nothing is installed", () => {
    expect(resolveLauncher("terminal", undefined, [])).toBeNull();
  });
});
