import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { maybeSyncResults } from "@/lib/resultSync";
import { maybeSendLockWarnings } from "@/lib/lockwarn";
import { isTipLocked } from "@/lib/scoring";
import { getLiveScore, type LiveScore } from "@/lib/liveScore";
import {
  fmtDay,
  fmtTime,
  STAGE_LABELS,
  PHASES,
  getPhase,
  currentPhaseId,
} from "@/lib/format";
import Header from "@/components/Header";
import TipCard, { type TipCardMatch } from "@/components/TipCard";

export const dynamic = "force-dynamic";

export default async function TippsPage({
  searchParams,
}: {
  searchParams: Promise<{ woche?: string }>;
}) {
  const session = await requireSession();
  await maybeSyncResults();
  await maybeSendLockWarnings();
  const params = await searchParams;
  const now = new Date();
  const currentPhase = currentPhaseId(now);
  const phaseId = Math.min(
    8,
    Math.max(1, Number(params.woche) || currentPhase)
  );
  const phase = getPhase(phaseId);

  // Spiele der gewählten Phase: Gruppenphase per Datumsfenster, K.o. per Stage
  const weekMatches = await prisma.match.findMany({
    where: phase.group
      ? {
          stage: "GROUP",
          kickoff: { gte: phase.group.start, lt: phase.group.end },
        }
      : { stage: { in: phase.stages } },
    include: {
      homeTeam: true,
      awayTeam: true,
      tips: { where: { userId: session.userId } },
    },
    orderBy: { kickoff: "asc" },
  });

  // Live-Zwischenstände für gerade laufende Spiele (geteilter 3-Min-Cache)
  const liveScores = new Map<number, LiveScore>();
  await Promise.all(
    weekMatches
      .filter(
        (m) =>
          m.status === "SCHEDULED" &&
          m.kickoff <= now &&
          m.homeScore === null &&
          m.homeTeamId &&
          m.awayTeamId
      )
      .map(async (m) => {
        const live = await getLiveScore(m.homeTeamId!, m.awayTeamId!);
        if (live) liveScores.set(m.id, live);
      })
  );

  // Anstehende/laufende Spiele zuoberst (chronologisch aufsteigend),
  // beendete Spiele nach unten (neuste zuerst).
  const isDone = (m: (typeof weekMatches)[number]) => m.status === "FINISHED";
  const openMatches = weekMatches.filter((m) => !isDone(m));
  const doneMatches = weekMatches.filter(isDone).reverse();

  const groupByDay = (list: typeof weekMatches) => {
    const map = new Map<string, typeof weekMatches>();
    for (const m of list) {
      const day = fmtDay(m.kickoff);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(m);
    }
    return [...map.entries()];
  };

  const openCount = weekMatches.filter(
    (m) =>
      m.status === "SCHEDULED" &&
      !isTipLocked(m.kickoff, now) &&
      m.homeTeamId &&
      m.tips.length === 0
  ).length;

  const renderMatch = (m: (typeof weekMatches)[number]) => {
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
            {m.homePlaceholder || "Paarung"} – Teams werden nach der Gruppenphase
            ermittelt
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
        m.stage === "GROUP" ? `Gruppe ${m.groupLetter}` : STAGE_LABELS[m.stage],
      homeName: m.homeTeam.name,
      homeFlag: m.homeTeam.flag,
      awayName: m.awayTeam.name,
      awayFlag: m.awayTeam.flag,
      locked: isTipLocked(m.kickoff, now) || m.status !== "SCHEDULED",
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      live: liveScores.get(m.id) ?? null,
      tipHome: tip?.homeGoals ?? null,
      tipAway: tip?.awayGoals ?? null,
      points: tip?.points ?? null,
    };
    return <TipCard key={m.id} match={card} />;
  };

  const renderSection = (
    list: typeof weekMatches,
    heading?: string
  ) =>
    groupByDay(list).map(([day, dayMatches], i) => (
      <section key={`${heading ?? ""}-${day}`}>
        {heading && i === 0 && (
          <h2 className="mb-2 mt-1 px-1 text-[13px] font-bold uppercase tracking-wide text-ink-2">
            {heading}
          </h2>
        )}
        <h2 className="mb-2 px-1 text-[16px] font-bold md:text-[18px]">{day}</h2>
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:grid-cols-3">
          {dayMatches.map(renderMatch)}
        </div>
      </section>
    ));

  return (
    <main>
      <Header title="Tipps" subtitle={`${phase.label} · ${phase.range}`} />

      {/* Phasen-Auswahl: Gruppenspieltage + K.o.-Runden */}
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto px-4 pb-1 md:px-0 md:flex-wrap md:overflow-visible">
        {PHASES.map((p) => (
          <Link
            key={p.id}
            href={`/tipps?woche=${p.id}`}
            className={`shrink-0 rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors ${
              p.id === phaseId ? "bg-tint text-white" : "card text-ink-2"
            }`}
          >
            {p.tab}
            {p.id === currentPhase && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green align-middle" />
            )}
          </Link>
        ))}
      </div>

      {openCount > 0 && (
        <div className="mb-3 px-4 md:px-0">
          <span className="inline-block rounded-full bg-orange/15 px-3 py-1.5 text-[13px] font-bold text-orange-deep">
            Noch {openCount} {openCount === 1 ? "offener Tipp" : "offene Tipps"} in
            dieser Phase
          </span>
        </div>
      )}
      <p className="mb-3 px-5 text-[12px] text-ink-2 md:px-0">
        🔒 Tippschluss ist jeweils 1 Stunde vor Anpfiff.
      </p>

      <div className="space-y-5 px-4 md:px-0">
        {weekMatches.length === 0 && (
          <div className="card p-8 text-center text-[14px] text-ink-2">
            In dieser Woche finden keine Spiele statt.
          </div>
        )}
        {renderSection(openMatches)}
        {doneMatches.length > 0 && renderSection(doneMatches, "Beendet")}
      </div>
    </main>
  );
}
