import { useState, type ReactNode } from "react";

/** The one place a specimen holds state: `<Live initial={false}>{(on, set) => ...}</Live>`. */
export function Live<T>({ initial, children }: { initial: T; children: (value: T, set: (v: T) => void) => ReactNode }) {
  const [value, set] = useState<T>(initial);
  return <>{children(value, set)}</>;
}
