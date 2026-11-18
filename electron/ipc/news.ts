import { listNews, openStory } from "../features/news";
import { FEEDS } from "../features/newsModel";
import { handle } from "./handle";
import { v } from "./validate";

const request = v.object({ feed: v.oneOf(FEEDS), refresh: v.bool });

export function register(): void {
  handle("news:list", v.args(request), ({ feed, refresh }) => listNews(feed, refresh));
  handle("news:open", v.args(v.int(1, Number.MAX_SAFE_INTEGER), v.oneOf(["article", "comments"] as const)),
    (id, target) => openStory(id, target));
}
