import { describe, expect, it } from "vitest";
import { IPC, IPC_PARTS } from "../shared/ipc";

/** The `app` part also holds these other prefixes (see the contract). */
const EXTRA_PREFIXES: Record<string, string[]> = { app: ["menu", "window", "log", "links"] };
const NAME = /^[a-z]+:[a-z]+(-[a-z]+)*$/;

describe("IPC channel map", () => {
  const parts = Object.entries(IPC_PARTS);

  it("every channel is '<part>:<verb-kebab>' with its part's prefix", () => {
    for (const [part, channels] of parts) {
      const allowed = [part, ...(EXTRA_PREFIXES[part] ?? [])];
      for (const name of Object.keys(channels)) {
        expect(name, name).toMatch(NAME);
        expect(allowed, `${name} in part ${part}`).toContain(name.split(":")[0]);
      }
    }
  });

  it("no key is silently overwritten by the spread", () => {
    const sum = parts.reduce((n, [, channels]) => n + Object.keys(channels).length, 0);
    expect(Object.keys(IPC).length).toBe(sum);
  });

  it("every channel has a known kind", () => {
    for (const [name, spec] of Object.entries(IPC)) expect(["invoke", "drop", "event"], name).toContain(spec.kind);
  });

  it("pushes are events and requests are invokes", () => {
    for (const name of ["data:changed", "settings:changed"] as const) expect(IPC[name].kind).toBe("event");
    expect(IPC["data:list"].kind).toBe("invoke");
  });
});
