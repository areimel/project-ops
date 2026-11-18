import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../../renderer/apps/editor/markdown";

describe("renderMarkdown links", () => {
  it("draws links as inert spans without an href", () => {
    const html = renderMarkdown("See [the site](https://example.com/a?b=1&c=2) and https://example.org");
    expect(html).not.toContain("<a");
    expect(html).not.toContain("href");
    expect(html).toContain('<span class="md-link" title="https://example.com/a?b=1&amp;c=2">the site</span>');
    expect(html).toContain('title="https://example.org"');
  });
  it("still escapes raw HTML", () => {
    expect(renderMarkdown("<script>x</script>")).not.toContain("<script>");
  });
});
