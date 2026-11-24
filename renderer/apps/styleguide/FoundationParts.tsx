// Small components the foundations entries share. Not an entry file, so it lives beside entries/, not in it.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useSettings } from "../../hooks/useSettings";
import { BASE_TOKENS } from "../../theme/tokenList";
import { contrastPairs } from "./styleguideModel";

/** What a token resolves to where it is drawn (inside its frame), as the raw CSS text: "13px", "#141310". */
export function useTokenValues(names: readonly string[]): [React.RefObject<HTMLDivElement | null>, Record<string, string>] {
  const ref = useRef<HTMLDivElement>(null);
  const [settings] = useSettings();
  const [values, setValues] = useState<Record<string, string>>({});
  const key = names.join(",");   // callers build `names` afresh each render: depend on its content, not its identity
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const list = key.split(",");
    // The frame applies its accent override in its own layout effect, which runs after ours; wait one frame.
    const read = () => {
      const cs = getComputedStyle(el);
      setValues(Object.fromEntries(list.map((n) => [n, cs.getPropertyValue(`--${n}`).trim()])));
    };
    const id = requestAnimationFrame(read);
    return () => cancelAnimationFrame(id);
  }, [key, settings.accent, settings.theme]);
  return [ref, values];
}

export function NotInUse() {
  return <span className="styleguide-cell-tag">Not in use yet</span>;
}

/** A token name in mono with its resolved value beside it, e.g. `--sp-3  12px`. */
export function TokenName({ name, unused, value }: { name: string; unused?: boolean; value?: string }) {
  return (
    <span className="styleguide-token">
      <code>--{name}</code>
      {value !== undefined && <span className="styleguide-token-value">{value}</span>}
      {unused && <NotInUse />}
    </span>
  );
}

/** Rows of `name, value` for tokens that are not colours. `draw` adds a sample to the row. */
export function TokenRows({ names, unused = [], draw }: { names: readonly string[]; unused?: readonly string[]; draw?: (name: string) => ReactNode }) {
  const [ref, values] = useTokenValues(names);
  return (
    <div className="styleguide-token-rows" ref={ref}>
      {names.map((n) => (
        <div key={n} className="styleguide-token-row">
          <TokenName name={n} value={values[n]} unused={unused.includes(n)} />
          {draw && <div className="styleguide-token-draw">{draw(n)}</div>}
        </div>
      ))}
    </div>
  );
}

export interface SwatchSpec { name: string; role: string; unused?: boolean }

/** A grid of colour swatches. Base tokens show the resolved hex; derived ones are colour-mix and show none. */
export function ColourSwatches({ tokens, showHex }: { tokens: readonly SwatchSpec[]; showHex: boolean }) {
  const names = tokens.map((t) => t.name);
  const [ref, values] = useTokenValues(names);
  return (
    <div className="styleguide-swatches" ref={ref}>
      {tokens.map((t) => (
        <figure key={t.name} className="styleguide-swatch">
          <div className="styleguide-swatch-chip"><span style={{ background: `var(--${t.name})` }} /></div>
          <figcaption>
            <TokenName name={t.name} unused={t.unused} />
            {showHex && <span className="styleguide-swatch-hex">{values[t.name]}</span>}
            <span className="styleguide-swatch-role">{t.role}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Text-on-background pairs of the base palette with their WCAG ratio and grade. */
export function ContrastTable() {
  const [ref, values] = useTokenValues(BASE_TOKENS);
  const pairs = contrastPairs(values);
  return (
    <div ref={ref}>
      <table className="styleguide-table">
        <thead><tr><th scope="col">Text</th><th scope="col">On</th><th scope="col">Sample</th><th scope="col">Ratio</th><th scope="col">Grade</th></tr></thead>
        <tbody>
          {pairs.map((p) => (
            <tr key={`${p.fg}/${p.bg}`}>
              <td><code>--{p.fg}</code></td>
              <td><code>--{p.bg}</code></td>
              <td><span className="styleguide-sample" style={{ color: `var(--${p.fg})`, background: `var(--${p.bg})` }}>Aa</span></td>
              <td>{p.ratio.toFixed(2)}</td>
              <td className={p.grade === "Fail" ? "styleguide-fail" : undefined}>{p.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
