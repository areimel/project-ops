// Hacker News through the main process. The page cannot reach the network (the packaged app's CSP has no
// connect-src), so main fetches from an allowlisted host, validates the answer, caches it and hands the
// renderer plain data. The renderer never sends a URL: it sends a story id and main looks the URL up.
import { supersededError } from "../../shared/superseded";
import type { NewsFeed, NewsPage } from "../../shared/ipc/news";
import { readJson, removeJson, writeJson } from "../store/jsonStore";
import { fetchJson, NetError } from "./net";
import { openExternalHttps } from "./links";
import {
  FEED_PATH, commentsUrl, healCache, healIds, healItem, isFresh, mapLimit, toItem, type CacheFile, type Story,
} from "./newsModel";

const API = "https://hacker-news.firebaseio.com/v0";
const CONCURRENCY = 6;
const CACHE_FILE = "news-cache.json";

let cache: CacheFile | null = null;
let latest = 0;   // bumped by every request; an older one that notices stops with a superseded error

function loadCache(): CacheFile {
  return (cache ??= readJson(CACHE_FILE, healCache));
}

function page(feed: NewsFeed, source: NewsPage["source"], offline: boolean): NewsPage {
  const c = loadCache()[feed];
  return { feed, items: (c?.stories ?? []).map(toItem), fetchedAt: c?.fetchedAt ?? 0, source, offline };
}

async function fetchStories(feed: NewsFeed, gen: number): Promise<Story[]> {
  const ids = await fetchJson(`${API}/${FEED_PATH[feed]}.json`, (raw) => healIds(raw));
  const results = await mapLimit(ids, CONCURRENCY, async (id): Promise<Story | NetError | null> => {
    if (gen !== latest) throw supersededError();
    try {
      return await fetchJson(`${API}/item/${id}.json`, healItem);
    } catch (e) {
      if (e instanceof NetError) return e;   // one bad item must not sink the page
      throw e;
    }
  });
  if (gen !== latest) throw supersededError();
  const stories = results.filter((r): r is Story => r !== null && !(r instanceof NetError));
  const failure = results.find((r): r is NetError => r instanceof NetError);
  if (failure && stories.length === 0) throw failure;
  return stories;
}

export async function listNews(feed: NewsFeed, refresh: boolean): Promise<NewsPage> {
  const gen = ++latest;
  const cached = loadCache()[feed];
  if (!refresh && cached && isFresh(cached.fetchedAt, Date.now())) return page(feed, "cache", false);
  try {
    const stories = await fetchStories(feed, gen);
    loadCache()[feed] = { fetchedAt: Date.now(), stories };
    writeJson(CACHE_FILE, { version: 1, feeds: loadCache() });
    return page(feed, "network", false);
  } catch (e) {
    // Offline is a state, not an error: show what we have (possibly nothing) and say so.
    if (e instanceof NetError && (e.kind === "offline" || e.kind === "timeout")) return page(feed, "cache", true);
    throw e;
  }
}

/** Opens the article, or the discussion when the story has no link. The URL comes from the cache, never from the renderer. */
export function openStory(id: number, target: "article" | "comments"): void {
  const story = Object.values(loadCache()).flatMap((f) => f.stories).find((s) => s.id === id);
  if (!story) throw new Error("That story is not in the list any more. Refresh and try again.");
  const url = target === "article" && story.url ? story.url : commentsUrl(id);
  if (!openExternalHttps(url)) throw new Error("That link could not be opened.");
}

/** Data reset: drop the cached stories, and supersede a fetch in flight so it cannot write the file back. */
export function clearNewsCache(): void {
  latest++;
  cache = null;
  removeJson(CACHE_FILE);
}
