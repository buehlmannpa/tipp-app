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
  const [items, articles] = await Promise.all([
    generateNews(),
    fetchFeedArticles(),
  ]);

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

        {articles.length > 0 && (
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
                    {a.date.toLocaleString("de-CH", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Europe/Zurich",
                    })}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold leading-snug">
                  {a.title} <span className="font-normal text-ink-3">↗</span>
                </h3>
                {a.summary && (
                  <p className="mt-1 line-clamp-3 text-[14px] leading-relaxed text-ink-2">
                    {a.summary}
                  </p>
                )}
              </a>
            ))}
            <p className="px-2 pb-1 text-center text-[12px] text-ink-3">
              Artikel von kicker und Sportschau · öffnen sich im Browser
            </p>
          </>
        )}
      </div>
    </main>
  );
}
