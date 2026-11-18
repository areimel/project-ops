import { describe, expect, it, vi } from "vitest";
import { createHandlerRegistry } from "../renderer/shell/handlerRegistry";

describe("handler registry", () => {
  it("runs a registered handler and reports unknown ids", () => {
    const r = createHandlerRegistry();
    const a = vi.fn();
    r.register({ "x.a": a });
    expect(r.has("x.a")).toBe(true);
    expect(r.run("x.a")).toBe(true);
    expect(a).toHaveBeenCalledOnce();
    expect(r.run("x.none")).toBe(false);
    expect(r.has("toString")).toBe(false);
  });
  it("lets the newest registration win and restores the older one when it goes", () => {
    const r = createHandlerRegistry();
    const first = vi.fn(), second = vi.fn();
    r.register({ "x.a": first });
    const off = r.register({ "x.a": second });
    r.run("x.a");
    expect(second).toHaveBeenCalledOnce();
    off();
    r.run("x.a");
    expect(first).toHaveBeenCalledOnce();
  });
  it("updates `table` in place", () => {
    const r = createHandlerRegistry();
    const t = r.table;
    const off = r.register({ "x.a": () => {} });
    expect(Object.keys(t)).toEqual(["x.a"]);
    off();
    expect(Object.keys(t)).toEqual([]);
  });
});
