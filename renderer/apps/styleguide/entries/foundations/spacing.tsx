import { SPACES } from "../../../../theme/tokenList";
import { TokenRows } from "../../FoundationParts";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "spacing",
  title: "Space and shape",
  family: "foundations",
  source: "renderer/theme/tokens.css",
  exports: ["renderer/theme/tokenList.ts"],
  purpose: "A seven-step space scale, one hairline weight, square corners and a short list of layers and durations. Nothing has a shadow.",
  useFor: ["Padding, gaps and margins from the --sp scale.", "Layers by token, so a popover never needs a magic z-index."],
  notFor: ["Rounded corners: --r is 0 by design.", "Motion other than a colour or border change in answer to an action."],
  snippet: ".toolbar { gap: var(--sp-2); padding: var(--sp-2) var(--sp-3); border-bottom: var(--line-w) solid var(--line); }",
  specimens: [
    {
      label: "Space scale",
      render: () => <TokenRows names={SPACES} draw={(n) => <span className="styleguide-bar-sample" style={{ width: `var(--${n})` }} />} />,
    },
    {
      label: "Lines and focus",
      render: () => (
        <TokenRows
          names={["line-w", "focus-w", "focus-offset", "hazard-w", "bullet"]}
          draw={(n) => {
            if (n === "line-w") return <span className="styleguide-box" style={{ borderWidth: "var(--line-w)" }} />;
            if (n === "focus-w") return <span className="styleguide-box" style={{ outline: "var(--focus-w) solid var(--focus)", outlineOffset: "var(--focus-offset)" }} />;
            if (n === "bullet") return <span className="bullet" />;
            return null;
          }}
        />
      ),
    },
    {
      label: "Control height and radius",
      render: () => (
        <TokenRows
          names={["control-h", "r", "r-pill"]} unused={["r-pill"]}
          draw={(n) => <span className="styleguide-box" style={n === "control-h" ? { height: "var(--control-h)", width: 72 } : { borderRadius: `var(--${n})` }} />}
        />
      ),
    },
    { label: "Layers", render: () => <TokenRows names={["z-base", "z-chrome", "z-popover", "z-dialog", "z-toast"]} unused={["z-base", "z-chrome"]} /> },
    { label: "Motion", render: () => <TokenRows names={["dur-fast", "dur", "dur-glitch", "ease"]} /> },
    { label: "Shell sizes and shadow", render: () => <TokenRows names={["titlebar-h", "footer-h", "content-max", "shadow-float"]} unused={["content-max"]} /> },
  ],
} satisfies CatalogueEntry;
