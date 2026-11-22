import type { ReactNode } from "react";
import { barcodeBars } from "./dossierModel";
import type { StatusTone } from "../../../components/common/StatusDot";

/** A diagonal-striped strip with a solid label plate in the middle. */
export function HazardBand({ children }: { children?: ReactNode }) {
  return (
    <div className="projects-dossier-hazard" aria-hidden="true">
      <span className="projects-dossier-hazard-plate">{children}</span>
    </div>
  );
}

export function Barcode({ id, height = 40 }: { id: string; height?: number }) {
  const { bars, width } = barcodeBars(id);
  return (
    <svg className="projects-dossier-barcode" aria-hidden="true" viewBox={`0 0 ${width} 10`} preserveAspectRatio="none"
      height={height} width="100%" fill="currentColor">
      {bars.map((b) => <rect key={b.x} x={b.x} y={0} width={b.w} height={10} />)}
    </svg>
  );
}

/** Four corner marks, positioned in the nearest positioned ancestor. */
export function RegMarks() {
  return (
    <>
      {["tl", "tr", "bl", "br"].map((c) => <span key={c} className={`projects-dossier-reg projects-dossier-reg-${c}`} aria-hidden="true" />)}
    </>
  );
}

/** A double-ruled stamped box. Not hidden: it carries text. */
export function Stamp({ tone = "accent", children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={`projects-dossier-stamp projects-dossier-stamp-${tone}`}><span className="projects-dossier-stamp-inner">{children}</span></span>;
}

export function DotGrid() {
  return <span className="projects-dossier-dotgrid" aria-hidden="true" />;
}
