import { useEffect, useState } from "react";
import type { NewsFeed, NewsItem } from "../../../shared/ipc/news";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { IconButton } from "../../components/common/IconButton";
import { List, ListRow } from "../../components/common/List";
import { Segmented } from "../../components/common/Segmented";
import { Spinner } from "../../components/common/Spinner";
import { Toolbar } from "../../components/common/Toolbar";
import { useCommandHandlers, useHint, useShell, useTitleInfo } from "../../shell/ShellContext";
import { errorMessage } from "../../utils/errorMessage";
import { clockTime, plural, relativeTime } from "./relativeTime";
import { useNews } from "./useNews";
import "./news.css";

const FEEDS: { value: NewsFeed; label: string }[] = [
  { value: "top", label: "Top" }, { value: "new", label: "New" }, { value: "best", label: "Best" },
];

/** Opening is a request by story id: main looks the address up in its own cache. The page never holds a URL. */
function open(id: number, target: "article" | "comments", fail: (m: string) => void): void {
  window.app.invoke("news:open", id, target).catch((e: unknown) => fail(errorMessage(e)));
}

function metaLine(s: NewsItem, now: number): string {
  return [s.host, plural(s.score, "point"), plural(s.comments, "comment"), relativeTime(s.time, now)]
    .filter(Boolean).join(", ");
}

export default function NewsApp() {
  const { toast } = useShell();
  const hintOf = useHint();
  const [feed, setFeed] = useState<NewsFeed>("top");
  const { page, loading, error, refresh } = useNews(feed);
  const items = page?.items ?? [];
  useTitleInfo({ count: page && items.length ? plural(items.length, "story", "stories") : undefined });
  useCommandHandlers({
    "news.refresh": refresh,
    "news.top": () => setFeed("top"), "news.new": () => setFeed("new"), "news.best": () => setFeed("best"),
  });
  // With stories on screen a failed refresh is a toast; with nothing to show it is the error state below.
  useEffect(() => { if (error && page) toast("error", error); }, [error, page, toast]);

  const now = Date.now();
  const failOpen = (m: string) => toast("error", m);

  let body;
  if (!page && error) {
    body = <EmptyState icon="warning" title="Couldn't load stories" body={`${error}. Check your connection and try again.`}
      action={<Button onClick={refresh}>Try again</Button>} />;
  } else if (!page) {
    body = <div className="news-loading"><Spinner label="Loading stories" /><p>Loading stories</p></div>;
  } else if (page.offline && items.length === 0) {
    body = <EmptyState icon="info" title="You're offline" body="There are no saved stories for this list yet. Connect to the internet and try again."
      action={<Button onClick={refresh}>Try again</Button>} />;
  } else if (items.length === 0) {
    body = <EmptyState icon="news" title="No stories right now" body="Hacker News returned an empty list. Try again in a moment."
      action={<Button onClick={refresh}>Refresh</Button>} />;
  } else {
    body = (
      <List label={`${FEEDS.find((f) => f.value === feed)?.label} stories`}>
        {items.map((s) => (
          <ListRow key={s.id}
            title={s.title} secondary={metaLine(s, now)} wrap
            // No host means no link (an Ask HN post): the row opens the discussion instead.
            onSelect={() => open(s.id, s.host ? "article" : "comments", failOpen)}
            trailing={s.host ? <Button variant="link" aria-label={`Comments on ${s.title}`}
              onClick={() => open(s.id, "comments", failOpen)}>Comments</Button> : undefined} />
        ))}
      </List>
    );
  }

  return (
    <div className="app-root news">
      <Toolbar label="News" end={<>
        {loading && page && <Spinner label="Refreshing" />}
        <IconButton icon="refresh" label={hintOf("news.refresh")} onClick={refresh} disabled={loading} />
      </>}>
        <Segmented label="Feed" options={FEEDS} value={feed} onChange={setFeed} />
      </Toolbar>
      {page?.offline && items.length > 0 && (
        <p className="news-notice" role="status">You're offline. Showing stories from {clockTime(page.fetchedAt)}.</p>
      )}
      <div className="news-body">{body}</div>
    </div>
  );
}
