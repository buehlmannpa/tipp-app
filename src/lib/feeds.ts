// Holt WM-Berichte von Sportredaktionen via RSS (serverseitig, 10 Min. Cache).
// Quellen ohne API-Key: kicker (WM-Ressort) und Sportschau (Fussball).

export type FeedArticle = {
  id: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  image: string | null;
  date: Date;
};

const FEEDS: { source: string; url: string; wmOnly: boolean }[] = [
  { source: "kicker", url: "https://newsfeed.kicker.de/news/wm", wmOnly: true },
  {
    source: "Sportschau",
    url: "https://www.sportschau.de/fussball/index~rss2.xml",
    wmOnly: false,
  },
];

// Für Feeds, die nicht WM-spezifisch sind
const WM_PATTERN = /\bWM\b|Weltmeisterschaft|World Cup|Nationalmannschaft|Nati\b/i;

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? m[1].trim() : "";
}

// Artikelbild aus media:content, media:thumbnail oder enclosure
function imageOf(block: string): string | null {
  const m = block.match(
    /<(?:media:content|media:thumbnail|enclosure)[^>]*url="([^"]+\.(?:jpe?g|png|webp)[^"]*)"/i
  );
  return m ? m[1] : null;
}

function clean(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadFeed(feed: (typeof FEEDS)[number]): Promise<FeedArticle[]> {
  const res = await fetch(feed.url, {
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(4000),
    headers: { "User-Agent": "WM-Tippspiel/1.0 (+PWA)" },
  });
  if (!res.ok) return [];
  const xml = await res.text();

  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const articles: FeedArticle[] = [];
  for (const item of items) {
    const title = clean(tag(item, "title"));
    const link = clean(tag(item, "link"));
    const summary = clean(tag(item, "description"));
    const pubDate = new Date(tag(item, "pubDate"));
    if (!title || !link || isNaN(pubDate.getTime())) continue;
    if (!feed.wmOnly && !WM_PATTERN.test(`${title} ${summary}`)) continue;
    articles.push({
      id: link,
      source: feed.source,
      title,
      summary,
      url: link,
      image: imageOf(item),
      date: pubDate,
    });
  }
  return articles;
}

export async function fetchFeedArticles(limit = 12): Promise<FeedArticle[]> {
  const results = await Promise.allSettled(FEEDS.map(loadFeed));
  const articles = results
    .filter(
      (r): r is PromiseFulfilledResult<FeedArticle[]> => r.status === "fulfilled"
    )
    .flatMap((r) => r.value);

  return articles
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}
