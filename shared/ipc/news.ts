import { invoke } from "./define";

export type NewsFeed = "top" | "new" | "best";
export interface NewsItem { id: number; title: string; host: string | null; score: number; by: string;
  comments: number; time: number }
export interface NewsPage { feed: NewsFeed; items: NewsItem[]; fetchedAt: number; source: "network" | "cache";
  offline: boolean }

export const newsIpc = {
  "news:list": invoke<[{ feed: NewsFeed; refresh: boolean }], NewsPage>(),
  "news:open": invoke<[id: number, target: "article" | "comments"], void>(),
} as const;
