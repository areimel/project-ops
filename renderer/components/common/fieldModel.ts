/** Joins ids for `aria-describedby`, skipping empty ones; undefined when nothing is left. */
export function joinIds(...ids: (string | false | null | undefined)[]): string | undefined {
  const kept = ids.flatMap((id) => (id ? id.split(/\s+/).filter(Boolean) : []));
  return kept.length > 0 ? [...new Set(kept)].join(" ") : undefined;
}
