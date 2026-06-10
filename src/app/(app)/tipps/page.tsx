import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { maybeSyncResults } from "@/lib/resultSync";
import {
  fmtDay,
  fmtTime,
  STAGE_LABELS,
  weekOf,
  weekRangeLabel,
} from "@/lib/format";
import Header from "@/components/Header";
import TipCard, { type TipCardMatch } from "@/components/TipCard";

export const dynamic = "force-dynamic";

const WEEKS = [1, 2, 3, 4, 5, 6];
const WEEK_START = Date.UTC(2026, 5, 11);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function TippsPage({
  searchParams,
}: {
  searchParams: Promise<{ woche?: string }>;
}) {
  const session = await requireSession();
  await maybeSyncResults();
  const params = await searchParams;
  const now = new Date();
  const currentWeek =
    now.getTime() >= WEEK_START ? weekOf(now) : 1;
  const week = Math.min(6, Math.max(1, Number(params.woche) || currentWeek));

  // Nur die Spiele der gewählten Woche laden
  const weekMatches = await prisma.match.findMany({
    where: {
      kickoff: {
        gte: new Date(WEEK_START + (week - 1) * WEEK_MS),
        lt: week === 6 ? undefined : new Date(WEEK_START + week * WEEK_MS),
      },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      tips: { where: { userId: session.userId } },
    },
    orderBy: { kickoff: "asc" },
  });

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

  // In der laufenden Woche direkt zum heutigen Tag springen
  const todayLabel = week === currentWeek ? fmtDay(now) : null;

  return (
    <main>
      <Header title="Tipps" subtitle={`Woche ${week} · ${weekRangeLabel(week)}`} />

      {/* Wochen-Auswahl */}
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {WEEKS.map((w) => (
          <Link
            key={w}
            href={`/tipps?woche=${w}`}
            className={`shrink-0 rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors ${
              w === week ? "bg-tint text-white" : "card text-ink-2"
            }`}
          >
            Woche {w}
          </Link>
        ))}
      </div>

      {openCount > 0 && (
        <div className="mb-3 px-4">
          <span className="inline-block rounded-full bg-orange/15 px-3 py-1.5 text-[13px] font-bold text-orange-deep">
            Noch {openCount} {openCount === 1 ? "offener Tipp" : "offene Tipps"} in
            dieser Woche
          </span>
        </div>
      )}

      <div className="space-y-5 px-4">
        {weekMatches.length === 0 && (
          <div className="card p-8 text-center text-[14px] text-ink-2">
            In dieser Woche finden keine Spiele statt.
          </div>
        )}
        {[...byDay.entries()].map(([day, dayMatches]) => (
          <section key={day} id={day === todayLabel ? "heute" : undefined}>
            <h2 className="mb-2 px-1 text-[16px] font-bold">
              {day}
              {day === todayLabel && (
                <span className="ml-2 rounded-full bg-tint-soft px-2 py-0.5 text-[11px] font-bold text-tint">
                  Heute
                </span>
              )}
            </h2>
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
                      <p className="py-2 text-center text-[14px] font-medium text-ink-2">
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

      {todayLabel && byDay.has(todayLabel) && (
        <ScrollToToday />
      )}
    </main>
  );
}

// Springt beim Laden der aktuellen Woche zum heutigen Tag
function ScrollToToday() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var el=document.getElementById('heute');if(el&&!location.hash&&el.getBoundingClientRect().top>window.innerHeight*0.7){el.scrollIntoView({block:'start'});window.scrollBy(0,-12);}})();`,
      }}
    />
  );
}
