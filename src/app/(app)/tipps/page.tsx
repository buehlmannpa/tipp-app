import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  fmtDay,
  fmtTime,
  STAGE_LABELS,
  weekOf,
  weekRangeLabel,
} from "@/lib/format";
import TipCard, { type TipCardMatch } from "@/components/TipCard";

export const dynamic = "force-dynamic";

const WEEKS = [1, 2, 3, 4, 5, 6];

export default async function TippsPage({
  searchParams,
}: {
  searchParams: Promise<{ woche?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const now = new Date();
  const currentWeek = weekOf(now) >= 1 && now.getTime() >= Date.UTC(2026, 5, 11) ? weekOf(now) : 1;
  const week = Math.min(6, Math.max(1, Number(params.woche) || currentWeek));

  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
      tips: { where: { userId: session.userId } },
    },
    orderBy: { kickoff: "asc" },
  });

  const weekMatches = matches.filter((m) => weekOf(m.kickoff) === week);

  // Nach Tag gruppieren
  const byDay = new Map<string, typeof weekMatches>();
  for (const m of weekMatches) {
    const day = fmtDay(m.kickoff);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(m);
  }

  const openCount = weekMatches.filter(
    (m) =>
      m.status === "SCHEDULED" &&
      m.kickoff > now &&
      m.homeTeamId &&
      m.tips.length === 0
  ).length;

  return (
    <main>
      <header className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-2">
        <p className="text-[13px] font-medium uppercase tracking-wide text-ink-2">
          Woche {week} · {weekRangeLabel(week)}
        </p>
        <h1 className="text-[32px] font-bold tracking-tight">Tipps</h1>
      </header>

      {/* Wochen-Auswahl */}
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {WEEKS.map((w) => (
          <Link
            key={w}
            href={`/tipps?woche=${w}`}
            className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
              w === week
                ? "bg-tint text-white"
                : "card text-ink-2"
            }`}
          >
            Woche {w}
          </Link>
        ))}
      </div>

      {openCount > 0 && (
        <p className="mb-3 px-5 text-[13px] font-medium text-orange">
          Noch {openCount} {openCount === 1 ? "offener Tipp" : "offene Tipps"} in
          dieser Woche
        </p>
      )}

      <div className="space-y-5 px-4">
        {weekMatches.length === 0 && (
          <div className="card p-8 text-center text-[14px] text-ink-2">
            In dieser Woche finden keine Spiele statt.
          </div>
        )}
        {[...byDay.entries()].map(([day, dayMatches]) => (
          <section key={day}>
            <h2 className="mb-2 px-1 text-[16px] font-bold">{day}</h2>
            <div className="space-y-3">
              {dayMatches.map((m) => {
                if (!m.homeTeam || !m.awayTeam) {
                  return (
                    <div key={m.id} className="card p-4">
                      <div className="mb-1 flex items-center justify-between text-[12px] text-ink-2">
                        <span className="rounded-full bg-card-2 px-2 py-0.5 font-semibold">
                          {STAGE_LABELS[m.stage]}
                        </span>
                        <span>
                          {fmtTime(m.kickoff)} · {m.city}
                        </span>
                      </div>
                      <p className="py-2 text-center text-[14px] font-medium text-ink-3">
                        {m.homePlaceholder || "Paarung"} – Teams werden nach der
                        Gruppenphase ermittelt
                      </p>
                    </div>
                  );
                }
                const tip = m.tips[0];
                const card: TipCardMatch = {
                  id: m.id,
                  kickoffIso: m.kickoff.toISOString(),
                  time: fmtTime(m.kickoff),
                  city: m.city,
                  badge:
                    m.stage === "GROUP"
                      ? `Gruppe ${m.groupLetter}`
                      : STAGE_LABELS[m.stage],
                  homeName: m.homeTeam.name,
                  homeFlag: m.homeTeam.flag,
                  awayName: m.awayTeam.name,
                  awayFlag: m.awayTeam.flag,
                  locked: m.kickoff <= now || m.status !== "SCHEDULED",
                  homeScore: m.homeScore,
                  awayScore: m.awayScore,
                  tipHome: tip?.homeGoals ?? null,
                  tipAway: tip?.awayGoals ?? null,
                  points: tip?.points ?? null,
                };
                return <TipCard key={m.id} match={card} />;
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
