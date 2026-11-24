import { FONT_SIZES } from "../../../../theme/tokenList";
import { TokenName, TokenRows } from "../../FoundationParts";
import type { CatalogueEntry } from "../../types";

const SAMPLE = "Pinned projects and recent work";
const SIZE_USE: Record<string, string> = {
  "fs-xs": "Labels, badges", "fs-sm": "Secondary text", "fs-md": "Body text", "fs-lg": "Lead text, h4", "fs-xl": "h3",
  "fs-2xl": "h2", "fs-3xl": "h1", "fs-display": "Dossier name, plate title",
};

export const entry = {
  id: "type",
  title: "Type",
  family: "foundations",
  source: "renderer/styles/base.css",
  exports: ["renderer/theme/tokens.css"],
  purpose: "DM Sans for text and headings, heavy and tightly tracked at the top of the scale. A mono face carries labels and small print.",
  useFor: ["Headings by element: h1 to h4 already carry the right size, weight and tracking.", "Sizes by token, never a raw pixel value."],
  notFor: ["A new font size when a token fits.", "Bold body text: use the medium weight."],
  snippet: ".projects-dossier-name { font-size: var(--fs-display); font-weight: var(--fw-heavy); letter-spacing: var(--track-heading); }",
  specimens: [
    {
      label: "Headings", wide: true,
      render: () => (
        <div className="styleguide-stack">
          <h1>Heading one, 34px heavy</h1>
          <h2>Heading two, 26px heavy</h2>
          <h3>Heading three, 20px heavy</h3>
          <h4>Heading four, 16px heavy</h4>
        </div>
      ),
    },
    {
      label: "Body",
      render: () => (
        <div className="styleguide-stack">
          <p>Body text is 14px at a line height of 1.6, which keeps paragraphs open and easy to scan.</p>
          <p className="styleguide-muted">Muted text carries secondary facts and keeps 4.5 to 1 contrast on every surface.</p>
          <p className="styleguide-small">Small text is 13px, used for hints and table cells.</p>
        </div>
      ),
    },
    {
      label: "Faces",
      render: () => (
        <TokenRows names={["font-text", "font-display", "font-mono"]} draw={(n) => <span style={{ fontFamily: `var(--${n})` }}>Hamburgefonstiv 0123</span>} />
      ),
    },
    {
      label: "Size scale", wide: true,
      render: () => (
        <div className="styleguide-token-rows">
          {FONT_SIZES.map((n) => (
            <div key={n} className="styleguide-type-row">
              <TokenName name={n} />
              <span className="styleguide-type-use">{SIZE_USE[n]}</span>
              <span className="styleguide-type-sample" style={{ fontSize: `var(--${n})` }}>{SAMPLE}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: "Weights",
      render: () => (
        <TokenRows
          names={["fw-regular", "fw-medium", "fw-bold", "fw-heavy"]} unused={["fw-bold"]}
          draw={(n) => <span style={{ fontWeight: `var(--${n})`, fontSize: "var(--fs-lg)" }}>Weight sample</span>}
        />
      ),
    },
    {
      label: "Line height and tracking",
      render: () => (
        <TokenRows
          names={["lh-tight", "lh-body", "track-heading", "label-track"]}
          draw={(n) => (n.startsWith("lh")
            ? <span className="styleguide-lines" style={{ lineHeight: `var(--${n})` }}>Two short lines of text<br />set at this height</span>
            : <span style={{ letterSpacing: `var(--${n})`, fontSize: "var(--fs-xl)", fontWeight: "var(--fw-heavy)" }}>Tracking sample</span>)}
        />
      ),
    },
  ],
} satisfies CatalogueEntry;
