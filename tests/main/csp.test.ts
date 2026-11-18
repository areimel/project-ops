import { describe, expect, it } from "vitest";
import { brand } from "../../shared/brand";
import { APP_ORIGIN, appScheme, buildCsp } from "../../shared/csp";

const directives = (csp: string): Record<string, string> =>
  Object.fromEntries(csp.split("; ").map((d) => { const [k, ...rest] = d.split(" "); return [k, rest.join(" ")]; }));

describe("buildCsp", () => {
  it("packaged: closed network, own origin only, no data: fonts", () => {
    const d = directives(buildCsp());
    expect(d["default-src"]).toBe("'self'");
    expect(d["script-src"]).toBe("'self'");
    expect(d["connect-src"]).toBe("'none'");
    expect(d["font-src"]).toBe("'self'");
    expect(d["img-src"]).toBe("'self' data:");
    expect(d["media-src"]).toBe(`${brand.mediaScheme}: blob:`);
    expect(d["base-uri"]).toBe("'none'");
    expect(d["object-src"]).toBe("'none'");
    expect(d["frame-ancestors"]).toBe("'none'");
    expect(buildCsp()).not.toMatch(/https?:|\*/);
  });
  it("dev: only the dev server's WebSocket and the refresh preamble are added", () => {
    const d = directives(buildCsp("http://localhost:5173"));
    expect(d["connect-src"]).toBe("'self' ws://localhost:5173");
    expect(d["script-src"]).toBe("'self' 'unsafe-inline'");
    expect(d["img-src"]).toBe("'self' data:");
    expect(d["frame-ancestors"]).toBe("'none'");
  });
  it("the app origin is its own scheme, not file:", () => {
    expect(appScheme).toBe(`${brand.scheme}-app`);
    expect(APP_ORIGIN).toBe(`${appScheme}://renderer`);
  });
});
