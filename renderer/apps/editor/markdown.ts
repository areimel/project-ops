import MarkdownIt from "markdown-it";

// html: false turns any raw HTML in the document into plain text, so the output is safe to inject.
const md = new MarkdownIt({ html: false, linkify: true });

// Images would make the preview fetch from the network as you type: show their description instead.
md.renderer.rules.image = (tokens, i) => md.utils.escapeHtml(tokens[i].content);

// Links are shown but cannot be followed (no channel opens an arbitrary address), so they are not links at all:
// a span has no href, is not focusable and does nothing on click. The address stays in the tooltip.
md.renderer.rules.link_open = (tokens, i) => {
  const href = String(tokens[i].attrGet("href") ?? "");
  return `<span class="md-link" title="${md.utils.escapeHtml(href)}">`;
};
md.renderer.rules.link_close = () => "</span>";

/** Markdown source to an HTML string. Links are drawn as inert spans. */
export function renderMarkdown(text: string): string {
  return md.render(text);
}
