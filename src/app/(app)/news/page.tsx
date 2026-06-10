import { Suspense } from "react";
import Link from "next/link";
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
        {items.map((item) => {
          const inner = (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                    item.tag === "Vorschau"
                      ? "bg-orange/15 text-orange-deep"
                      : "bg-tint-soft text-tint"
                  }`}
                >
                  {item.tag}
                </span>
                <span className="text-[12px] text-ink-2">
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
                {item.href && (
                  <span className="ml-1 font-semibold text-tint">Zum Tippen ›</span>
                )}
              </p>
            </>
          );
          return item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className="card block p-4 active:bg-card-2"
            >
              {inner}
            </Link>
          ) : (
            <article key={item.id} className="card p-4">
              {inner}
            </article>
          );
        })}

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
            <span className="text-[12px] text-ink-2">
              {a.date.toLocaleDateString("de-CH", {
                day: "numeric",
                month: "short",
                timeZone: "Europe/Zurich",
              })}
            </span>
          </div>
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-[17px] font-bold leading-snug">{a.title}</h3>
              {a.summary && (
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
                  {a.summary}
                </p>
              )}
            </div>
            {a.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.image}
                alt=""
                loading="lazy"
                className="mt-0.5 h-20 w-20 shrink-0 rounded-xl object-cover"
              />
            )}
          </div>
        </a>
      ))}
      <p className="px-2 pb-1 text-center text-[12px] text-ink-2">
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
