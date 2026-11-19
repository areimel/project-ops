import { describe, expect, it } from "vitest";
import {
  RESOURCE_LIMITS, RESOURCE_MESSAGES, healResourceLink, healResourceLinkPatch, resourcePatchProblem, toResourceLinkView,
} from "../../shared/resources/links";

const garbage = [undefined, null, 5, "x", [], () => 1];

describe("healResourceLink", () => {
  it("is null for garbage, an empty name or an unsafe URL", () => {
    for (const g of garbage) expect(healResourceLink(g)).toBeNull();
    expect(healResourceLink({ name: "  ", url: "https://x.test" })).toBeNull();
    for (const url of ["http://x.test", "javascript:alert(1)", "file:///etc/passwd", "https://me:pw@x.test", "x.test", "", 5]) {
      expect(healResourceLink({ name: "A", url }), String(url)).toBeNull();
    }
  });

  it("trims, cuts to the limits, normalises the URL and drops unknown keys", () => {
    expect(healResourceLink({ name: "  Net \n lify ", url: " https://App.Netlify.com ", group: " Hosting ", extra: 1 }))
      .toEqual({ name: "Net lify", url: "https://app.netlify.com/", group: "Hosting" });
    const long = healResourceLink({ name: "n".repeat(200), url: "https://x.test/", group: "g".repeat(200) });
    expect(long?.name).toHaveLength(RESOURCE_LIMITS.name);
    expect(long?.group).toHaveLength(RESOURCE_LIMITS.group);
    expect(healResourceLink({ name: "A", url: "https://x.test/", group: 7 })?.group).toBe("");
  });

  it("the view carries the id and the three fields only", () => {
    expect(toResourceLinkView({ id: "0123456789abcdef", createdAt: 1, updatedAt: 2, name: "A", url: "https://x.test/", group: "" }))
      .toEqual({ id: "0123456789abcdef", name: "A", url: "https://x.test/", group: "" });
  });
});

describe("healResourceLinkPatch", () => {
  it("keeps valid keys and drops invalid or unknown ones", () => {
    for (const g of garbage) expect(healResourceLinkPatch(g)).toEqual({});
    expect(healResourceLinkPatch({ name: " A ", url: "https://x.test", group: "", id: "x", path: "/etc" }))
      .toEqual({ name: "A", url: "https://x.test/", group: "" });
    expect(healResourceLinkPatch({ name: "", url: "http://x.test", group: null })).toEqual({});
  });
});

describe("resourcePatchProblem", () => {
  it("a new link needs a name and an https URL", () => {
    expect(resourcePatchProblem({ name: "A", url: "https://x.test" }, true)).toBeNull();
    expect(resourcePatchProblem({ url: "https://x.test" }, true)).toBe(RESOURCE_MESSAGES.name);
    expect(resourcePatchProblem({ name: "A" }, true)).toBe(RESOURCE_MESSAGES.url);
    expect(resourcePatchProblem({ name: "A", url: "http://x.test" }, true)).toBe(RESOURCE_MESSAGES.url);
    expect(resourcePatchProblem("nope", true)).toBe(RESOURCE_MESSAGES.name);
  });

  it("an edit only objects to keys that were sent and are invalid", () => {
    expect(resourcePatchProblem({ group: "Hosting" }, false)).toBeNull();
    expect(resourcePatchProblem({}, false)).toBeNull();
    expect(resourcePatchProblem({ name: " " }, false)).toBe(RESOURCE_MESSAGES.name);
    expect(resourcePatchProblem({ url: "https://me:pw@x.test" }, false)).toBe(RESOURCE_MESSAGES.url);
  });
});
