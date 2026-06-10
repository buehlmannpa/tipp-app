import { requireSession } from "@/lib/auth";
import { generateNews } from "@/lib/news";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

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
      </div>
    </main>
  );
}
