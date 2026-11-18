import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsFeed, NewsPage } from "../../../shared/ipc/news";
import { isSuperseded } from "../../../shared/superseded";
import { errorMessage } from "../../utils/errorMessage";

export interface NewsState {
  /** Stories for the selected feed, or null until they arrive (a page for another feed is never shown). */
  page: NewsPage | null;
  loading: boolean;
  /** The last request failed (not offline: that is a page with `offline` set). */
  error: string | null;
  refresh(): void;
}

/**
 * Loads the selected feed through main. Only the latest request may touch state: switching feeds or pressing
 * refresh makes every earlier response irrelevant, even if it arrives later.
 */
export function useNews(feed: NewsFeed): NewsState {
  const [page, setPage] = useState<NewsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);

  const load = useCallback((refresh: boolean) => {
    const id = ++request.current;
    setLoading(true);
    window.app.invoke("news:list", { feed, refresh }).then(
      (p) => {
        if (id !== request.current) return;
        setPage(p); setError(null); setLoading(false);
      },
      (e: unknown) => {
        if (id !== request.current || isSuperseded(e)) return;
        const message = errorMessage(e);
        setLoading(false);
        setError(message);
      },
    );
  }, [feed]);

  useEffect(() => { setError(null); load(false); }, [load]);

  return {
    page: page?.feed === feed ? page : null,
    loading, error,
    refresh: useCallback(() => load(true), [load]),
  };
}
