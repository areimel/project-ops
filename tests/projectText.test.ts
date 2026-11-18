import { describe, expect, it } from "vitest";
import { plural } from "../renderer/utils/plural";
import { projectCount, scanMessage } from "../renderer/utils/projectText";

describe("plural", () => {
  it("picks the form by count", () => {
    expect([plural(0, "day", "days"), plural(1, "day", "days"), plural(2, "day", "days")]).toEqual(["0 days", "1 day", "2 days"]);
  });
});

describe("projectText", () => {
  it("words the scan result", () => {
    expect(scanMessage({ added: 0, missing: 0 })).toBe("No new projects");
    expect(scanMessage({ added: 1, missing: 0 })).toBe("Found 1 new project");
    expect(scanMessage({ added: 3, missing: 1 })).toBe("Found 3 new projects. 1 folder is missing.");
    expect(scanMessage({ added: 0, missing: 2 })).toBe("No new projects. 2 folders are missing.");
  });
  it("words the count", () => {
    expect([projectCount(0), projectCount(1), projectCount(42)]).toEqual(["0 projects", "1 project", "42 projects"]);
  });
});
