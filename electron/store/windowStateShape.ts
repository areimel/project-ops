/** Pure: no electron. `x`/`y` are absent when the position is unknown or no longer on a display. */
export interface Rect { x: number; y: number; width: number; height: number }
export interface Bounds { x?: number; y?: number; width: number; height: number }
export interface WindowState { bounds: Bounds | null; maximized: boolean }

export const MIN_WIDTH = 720;
export const MIN_HEIGHT = 480;
const MAX_SIZE = 20_000;
const VISIBLE_W = 100;   // how much of the window must overlap a work area to count as visible
const VISIBLE_H = 50;

const num = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

export function healWindowState(raw: unknown): WindowState {
  if (!isObj(raw)) return { bounds: null, maximized: false };
  const maximized = raw.maximized === true;
  const b = raw.bounds;
  if (!isObj(b) || !num(b.width) || !num(b.height) || b.width < 1 || b.height < 1 || b.width > MAX_SIZE || b.height > MAX_SIZE) {
    return { bounds: null, maximized };
  }
  const bounds: Bounds = { width: Math.round(b.width), height: Math.round(b.height) };
  if (num(b.x) && num(b.y) && Math.abs(b.x) <= 100_000 && Math.abs(b.y) <= 100_000) {
    bounds.x = Math.round(b.x);
    bounds.y = Math.round(b.y);
  }
  return { bounds, maximized };
}

const overlap = (a0: number, a1: number, b0: number, b1: number): number => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/** Keeps the window on a visible work area; drops x/y when off every display; min 720x480. */
export function fitToDisplays(s: WindowState, workAreas: Rect[]): WindowState {
  if (!s.bounds) return s;
  const { x, y } = s.bounds;
  let width = Math.max(MIN_WIDTH, s.bounds.width);
  let height = Math.max(MIN_HEIGHT, s.bounds.height);
  if (workAreas.length === 0) return { ...s, bounds: { x, y, width, height } };

  const area = x === undefined || y === undefined ? undefined : workAreas.find((w) =>
    overlap(x, x + width, w.x, w.x + w.width) >= Math.min(VISIBLE_W, width) &&
    overlap(y, y + height, w.y, w.y + w.height) >= Math.min(VISIBLE_H, height));
  const target = area ?? workAreas[0];
  width = Math.max(MIN_WIDTH, Math.min(width, target.width));
  height = Math.max(MIN_HEIGHT, Math.min(height, target.height));
  if (!area || x === undefined || y === undefined) return { ...s, bounds: { width, height } };
  return {
    ...s,
    bounds: {
      x: Math.max(area.x, Math.min(x, area.x + area.width - width)),
      y: Math.max(area.y, Math.min(y, area.y + area.height - height)),
      width, height,
    },
  };
}
