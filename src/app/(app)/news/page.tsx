import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { generateNews } from "@/lib/news";
import { fetchFeedArticles } from "@/lib/feeds";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

const SOURCE_STYLE: Record<string, string> = {
  kicker: "bg-red/15 text-red",
  Sportschau: "bg-green/15 text-green",
};

export default async function NewsPage() {
  await requireSession();
  const items = await generateNews();

  return (
    <main>
      <Header title="News" subtitle="Zusammenfassung der letzten Spiele" />

      <div className="space-y-3 px-4">
        {items.length === 0 && (
          <div className="card p-8 text-center text-[14px] text-ink-2">
            Sobald die ersten Spiele gespielt sind, findest du hier die
            Zusammenfassungen.
          </div>
        )}
        {items.map((item) => (
          <article key={item.id} className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                  item.tag === "Vorschau"
                    ? "bg-orange/15 text-orange"
                    : "bg-tint-soft text-tint"
                }`}
              >
                {item.tag}
              </span>
              <span className="text-[12px] text-ink-3">
                {item.date.toLocaleDateString("de-CH", {
                  day: "numeric",
                  month: "short",
                  timeZone: "Europe/Zurich",
                })}
              </span>
            </div>
            <h2 className="text-[17px] font-bold leading-snug">{item.title}</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
              {item.body}
            </p>
          </article>
        ))}

        {/* Externe Feeds streamen nach – blockieren das Seitenladen nicht */}
        <Suspense fallback={<FeedSkeleton />}>
          <FeedSection />
        </Suspense>
      </div>
    </main>
  );
}

async function FeedSection() {
  const articles = await fetchFeedArticles();
  if (articles.length === 0) return null;

  return (
    <>
      <h2 className="px-1 pt-3 text-[20px] font-bold tracking-tight">
        Highlights & Berichte
      </h2>
      {articles.map((a) => (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="card block p-4 active:bg-card-2"
        >
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                SOURCE_STYLE[a.source] ?? "bg-tint-soft text-tint"
              }`}
            >
              {a.source}
            </span>
            <span className="text-[12px] text-ink-3">
              {a.date.toLocaleDateString("de-CH", {
                day: "numeric",
                month: "short",
                timeZone: "Europe/Zurich",
              })}
            </span>
          </div>
          <h3 className="text-[17px] font-bold leading-snug">{a.title}</h3>
          {a.summary && (
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
              {a.summary}
            </p>
          )}
        </a>
      ))}
      <p className="px-2 pb-1 text-center text-[12px] text-ink-3">
        Artikel von kicker und Sportschau · öffnen sich im Browser
      </p>
    </>
  );
}

function FeedSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="mt-3 h-7 w-56 rounded-lg bg-card" />
      <div className="card h-32" />
      <div className="card h-32" />
    </div>
  );
}
