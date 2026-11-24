import type { ReactNode } from "react";

export type Family = "foundations" | "actions" | "inputs" | "display" | "feedback" | "overlays" | "layout" | "patterns";

export interface Specimen {
  label: string;
  /** Called as a plain function by a wrapper component: no hooks in it. Stateful specimens use <Live>. */
  render(): ReactNode;
  /** Fixed box width in px (for container-query demos). */
  width?: number;
  /** Reserved height in px (room for an open menu). */
  minHeight?: number;
  /** Spans the whole row. */
  wide?: boolean;
  notInUse?: boolean;
}

export interface CatalogueEntry {
  id: string;                 // ^[a-z][a-z0-9-]*$, unique
  title: string;
  family: Family;
  source: string;             // path of the source file
  exports?: string[];
  purpose: string;
  useFor: string[];
  notFor: string[];
  snippet: string;
  specimens: Specimen[];
  status?: "not-in-use";
  notes?: string[];
}
