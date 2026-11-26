/** What a form dialog does when asked to save: nothing while it cannot, close when nothing changed, else save. */
export function saveStep<P>(blocked: boolean, patch: () => P | null): { kind: "ignore" } | { kind: "close" } | { kind: "save"; patch: P } {
  if (blocked) return { kind: "ignore" };
  const next = patch();
  return next === null ? { kind: "close" } : { kind: "save", patch: next };
}

/** Joins ids for `aria-describedby`, skipping empty ones; undefined when nothing is left. */
export function joinIds(...ids: (string | false | null | undefined)[]): string | undefined {
  const kept = ids.flatMap((id) => (id ? id.split(/\s+/).filter(Boolean) : []));
  return kept.length > 0 ? [...new Set(kept)].join(" ") : undefined;
}
