import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leaderboard } from "@/lib/leaderboard";
import { maybeSyncResults } from "@/lib/resultSync";
import { getAvatar } from "@/lib/profile";
import { currentWeek, fmtShort, fmtTime, weekBounds } from "@/lib/format";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await requireSession();
  await maybeSyncResults();
  const now = new Date();

  const week = currentWeek(now);
  const { end: weekEnd } = weekBounds(week);

  const [entries, nextMatches, lastResults, myTipCount, openThisWeek, myAvatar] =
    await Promise.all([
      leaderboard(),
      prisma.match.findMany({
        where: { status: "SCHEDULED", kickoff: { gte: now }, homeTeam: { isNot: null } },
        include: {
          homeTeam: true,
          awayTeam: true,
          tips: { where: { userId: session.userId } },
        },
        orderBy: { kickoff: "asc" },
        take: 3,
      }),
      prisma.match.findMany({
        where: { status: "FINISHED" },
        include: {
          homeTeam: true,
          awayTeam: true,
          tips: { where: { userId: session.userId } },
        },
        orderBy: { kickoff: "desc" },
        take: 3,
      }),
      prisma.tip.count({ where: { userId: session.userId } }),
      prisma.match.count({
        where: {
          status: "SCHEDULED",
          kickoff: { gte: now, lt: weekEnd },
          homeTeam: { isNot: null },
          tips: { none: { userId: session.userId } },
        },
      }),
      getAvatar(session.userId),
    ]);

  const me = entries.find((e) => e.userId === session.userId);
  const top3 = entries.slice(0, 3);

  return (
    <main>
      <header className="flex items-end justify-between px-5 pt-[max(env(safe-area-inset-top),20px)] pb-2">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-wide text-ink-2">
            WM 2026 · USA, Kanada & Mexiko
          </p>
          <h1 className="text-[32px] font-bold tracking-tight">
            Hoi {session.username} 👋
          </h1>
        </div>
        <Link href="/profil" aria-label="Profil öffnen" className="mb-1">
          <Avatar name={session.username} emoji={myAvatar} size={40} />
        </Link>
      </header>

      <div className="space-y-4 px-4">
        {/* Statistik-Kacheln */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Punkte" value={me?.points ?? 0} accent="text-tint" />
          <Stat label="Rang" value={me ? `#${me.rank}` : "–"} accent="text-gold" />
          <Stat label="Exakt" value={me?.exact ?? 0} accent="text-green" />
        </div>

        {openThisWeek > 0 && (
          <Link
            href="/tipps"
            className="flex items-center justify-between rounded-[20px] bg-gradient-to-br from-[#0a84ff] to-[#0040dd] p-4 shadow-md"
          >
            <div>
              <p className="text-[16px] font-bold text-white">
                {openThisWeek === 1
                  ? "1 offener Tipp diese Woche"
                  : `${openThisWeek} offene Tipps diese Woche`}
              </p>
              <p className="text-[13px] text-white/80">Jetzt tippen, bevor’s losgeht</p>
            </div>
            <span className="text-[22px] text-white">→</span>
          </Link>
        )}

        {/* Nächste Spiele */}
        <section>
          <SectionTitle title="Nächste Spiele" href="/tipps" />
          <div className="card divide-y divide-sep overflow-hidden">
            {nextMatches.length === 0 && (
              <p className="p-5 text-center text-[14px] text-ink-2">
                Keine anstehenden Spiele.
              </p>
            )}
            {nextMatches.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-14 text-[12px] leading-tight text-ink-2">
                  {fmtShort(m.kickoff)}
                  <br />
                  {fmtTime(m.kickoff)}
                </div>
                <div className="flex-1 text-[15px] font-semibold">
                  {m.homeTeam!.flag} {m.homeTeam!.name}
                  <span className="px-1.5 text-ink-3">–</span>
                  {m.awayTeam!.flag} {m.awayTeam!.name}
                </div>
                {m.tips.length > 0 ? (
                  <span className="rounded-full bg-green/15 px-2 py-0.5 text-[12px] font-bold text-green">
                    Tipp {m.tips[0].homeGoals}:{m.tips[0].awayGoals}
                  </span>
                ) : (
                  <Link
                    href="/tipps"
                    className="rounded-full bg-orange/15 px-2 py-0.5 text-[12px] font-bold text-orange-deep"
                  >
                    offen
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Letzte Resultate */}
        {lastResults.length > 0 && (
          <section>
            <SectionTitle title="Letzte Resultate" href="/news" />
            <div className="card divide-y divide-sep overflow-hidden">
              {lastResults.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 text-[15px] font-semibold">
                    {m.homeTeam!.flag} {m.homeTeam!.name}
                    <span className="px-1.5 font-bold tabular-nums">
                      {m.homeScore}:{m.awayScore}
                    </span>
                    {m.awayTeam!.flag} {m.awayTeam!.name}
                  </div>
                  {m.tips[0]?.points !== null && m.tips[0] && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${
                        m.tips[0].points! >= 3
                          ? "bg-green/15 text-green"
                          : m.tips[0].points! > 0
                            ? "bg-orange/15 text-orange"
                            : "bg-card-2 text-ink-3"
                      }`}
                    >
                      +{m.tips[0].points}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top 3 */}
        <section>
          <SectionTitle title="Spitzenreiter" href="/rangliste" />
          <div className="card divide-y divide-sep overflow-hidden">
            {top3.length === 0 && (
              <p className="p-5 text-center text-[14px] text-ink-2">
                Noch keine Punkte vergeben.
              </p>
            )}
            {top3.map((e, i) => (
              <div key={e.userId} className="flex items-center gap-3 px-4 py-3">
                <span className="text-[20px]">{["🥇", "🥈", "🥉"][i]}</span>
                <span className="flex-1 text-[15px] font-semibold">{e.username}</span>
                <span className="font-bold tabular-nums">{e.points} P.</span>
              </div>
            ))}
          </div>
        </section>

        <p className="pb-2 pt-1 text-center text-[12px] text-ink-2">
          {myTipCount} Tipps abgegeben · Punktesystem: 3 exakt / 1 Tendenz
        </p>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="card flex flex-col items-center px-2 py-4">
      <span className={`text-[24px] font-bold tabular-nums ${accent}`}>{value}</span>
      <span className="text-[12px] font-medium text-ink-2">{label}</span>
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between px-1">
      <h2 className="text-[20px] font-bold tracking-tight">{title}</h2>
      <Link href={href} className="text-[14px] font-medium text-tint">
        Alle →
      </Link>
    </div>
  );
}
