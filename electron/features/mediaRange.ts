// Pure: no electron, no fs. Parses the HTTP Range header of a media request.

export type ByteRange = { start: number; end: number };   // inclusive, as in Content-Range

/**
 * `null`: no usable range, send the whole file (a missing header, another unit, several ranges, or
 * garbage: RFC 9110 says to ignore those). `"unsatisfiable"`: a well-formed range that lies outside
 * the file; answer 416. Otherwise the clamped range to send with 206.
 */
export function parseRange(header: string | null, size: number): ByteRange | "unsatisfiable" | null {
  const m = header === null ? null : /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  if (size <= 0) return "unsatisfiable";
  if (m[1] === "") {                       // "-N": the last N bytes
    const n = Number(m[2]);
    return n === 0 ? "unsatisfiable" : { start: Math.max(0, size - n), end: size - 1 };
  }
  const start = Number(m[1]);
  if (m[2] !== "" && Number(m[2]) < start) return null;   // "5-2" is malformed
  const end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  return start >= size ? "unsatisfiable" : { start, end };
}
