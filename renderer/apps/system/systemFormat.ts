/** "3 min", "2 h 05 min", "4 d 6 h". Coarse on purpose: the text changes at most once a minute. */
export function formatUptime(sec: number): string {
  const total = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, "0")} min`;
  return `${minutes} min`;
}

/** 0 to 1 for a bar: out-of-range and non-finite inputs are clamped, a zero total gives 0. */
export function fraction(part: number, whole: number): number {
  if (!(whole > 0) || !Number.isFinite(part)) return 0;
  return Math.min(1, Math.max(0, part / whole));
}

export const formatPercent = (n: number): string => `${n.toFixed(1)}%`;
