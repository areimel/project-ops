// Pure parts of news.ts (no electron import, so tests can load them). Everything from the API is untrusted:
// healItem builds a fresh object with checked types and capped lengths instead of passing the payload along.
import type { NewsFeed, NewsItem } from "../../shared/ipc/news";

export const FEEDS = ["top", "new", "best"] as const satisfies readonly NewsFeed[];
export const FEED_PATH: Record<NewsFeed, string> = { top: "topstories", new: "newstories", best: "beststories" };
export const STORIES_PER_FEED = 30;
export const CACHE_TTL_MS = 5 * 60_000;
const MAX_TITLE = 300;
const MAX_URL = 2000;
const MAX_NAME = 64;

/** A story as main keeps it. The URL stays here: the renderer only ever gets `host`. Field names follow the API. */
export interface Story { id: number; title: string; url: string | null; score: number; by: string; descendants: number; time: number }

const int = (x: unknown, min: number, max: number): number | null =>
  typeof x === "number" && Number.isInteger(x) && x >= min && x <= max ? x : null;
const text = (x: unknown, max: number): string => (typeof x === "string" ? x.slice(0, max) : "");

/** A clean https URL, or null. Only https is kept, so a stored URL is always safe to hand to the browser. */
export function safeUrl(x: unknown): string | null {
  if (typeof x !== "string" || x.length > MAX_URL) return null;
  try {
    const u = new URL(x);
    return u.protocol === "https:" && u.username === "" && u.password === "" ? u.href : null;
  } catch {
    return null;
  }
}

/** One story from the API (or from the cache file, which uses the same shape), or null when it is not a usable story. */
export function healItem(raw: unknown): Story | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.deleted === true || r.dead === true) return null;
  if (r.type !== undefined && r.type !== "story") return null;   // jobs and polls have no discussion to show
  const id = int(r.id, 1, Number.MAX_SAFE_INTEGER);
  const title = text(r.title, MAX_TITLE).trim();
  if (id === null || !title) return null;
  return {
    id, title, url: safeUrl(r.url),
    score: int(r.score, 0, 1_000_000) ?? 0, by: text(r.by, MAX_NAME),
    descendants: int(r.descendants, 0, 1_000_000) ?? 0,
    time: int(r.time, 0, 4_102_444_800) ?? 0,
  };
}

/** A feed endpoint answers with an array of story ids. Keeps the first `limit` valid ones. */
export function healIds(raw: unknown, limit = STORIES_PER_FEED): number[] {
  if (!Array.isArray(raw)) throw new Error("not a list");
  const ids: number[] = [];
  for (const x of raw) {
    const id = int(x, 1, Number.MAX_SAFE_INTEGER);
    if (id !== null) ids.push(id);
    if (ids.length === limit) break;
  }
  return ids;
}

/** "example.com" for an https URL (a leading "www." is dropped); null when there is no usable URL. */
export function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export function isFresh(fetchedAt: number, now: number, ttlMs = CACHE_TTL_MS): boolean {
  return fetchedAt > 0 && now >= fetchedAt && now - fetchedAt < ttlMs;
}

export function toItem(s: Story): NewsItem {
  return { id: s.id, title: s.title, host: hostOf(s.url), score: s.score, by: s.by, comments: s.descendants, time: s.time };
}

export const commentsUrl = (id: number): string => `https://news.ycombinator.com/item?id=${id}`;

export interface CachedFeed { fetchedAt: number; stories: Story[] }
export type CacheFile = Partial<Record<NewsFeed, CachedFeed>>;

/** news-cache.json is `{ version: 1, feeds: { top: { fetchedAt, stories } } }`. Anything else heals to empty. */
export function healCache(raw: unknown): CacheFile {
  const out: CacheFile = {};
  const feeds = (raw as { feeds?: unknown } | null | undefined)?.feeds;
  if (typeof feeds !== "object" || feeds === null) return out;
  for (const feed of FEEDS) {
    const f = (feeds as Record<string, unknown>)[feed] as { fetchedAt?: unknown; stories?: unknown } | null | undefined;
    const fetchedAt = int(f?.fetchedAt, 1, 4_102_444_800_000);
    if (fetchedAt === null || !Array.isArray(f?.stories)) continue;
    const stories = f.stories.slice(0, STORIES_PER_FEED).map(healItem).filter((s): s is Story => s !== null);
    out[feed] = { fetchedAt, stories };
  }
  return out;
}

/** Runs `fn` over `inputs` with at most `limit` in flight and keeps the order of the results. */
export async function mapLimit<T, R>(inputs: readonly T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(inputs.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < inputs.length) {
      const i = next++;
      results[i] = await fn(inputs[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, inputs.length) }, worker));
  return results;
}
