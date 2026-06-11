import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDay, fmtTime, STAGE_LABELS } from "@/lib/format";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

// Tippvergleich: Nach Anpfiff siehst du hier die Tipps deiner Gruppenmitglieder.
export default async function SpielPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id: Number(id) || 0 },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!match || !match.homeTeam || !match.awayTeam) notFound();

  const locked = match.kickoff <= new Date() || match.status !== "SCHEDULED";
  const finished = match.homeScore !== null;

  // Mitglieder aller eigenen Gruppen (Tipps sind erst nach Anpfiff sichtbar)
  const memberships = await prisma.groupMember.findMany({
    where: {
      group: { members: { some: { userId: session.userId } } },
    },
    select: { userId: true },
  });
  const visibleUserIds = locked
    ? [...new Set([...memberships.map((m) => m.userId), session.userId])]
    : [session.userId];

  const tips = await prisma.tip.findMany({
    where: { matchId: match.id, userId: { in: visibleUserIds } },
    include: { user: { select: { id: true, username: true, avatar: true } } },
    orderBy: [{ points: "desc" }, { user: { username: "asc" } }],
  });

  return (
    <main>
      <Header
        title="Spiel"
        subtitle={`${
          match.stage === "GROUP"
            ? `Gruppe ${match.groupLetter}`
            : STAGE_LABELS[match.stage]
        } · ${match.city}`}
      />

      <div className="space-y-4 px-4">
        {/* Spielkopf */}
        <div className="card p-5">
          <p className="mb-3 text-center text-[13px] text-ink-2">
            {fmtDay(match.kickoff)} · {fmtTime(match.kickoff)} Uhr
          </p>
          <div className="flex items-center justify-between gap-2">
            <TeamCol flag={match.homeTeam.flag} name={match.homeTeam.name} />
            <span className="text-[34px] font-bold tabular-nums">
              {finished ? `${match.homeScore}:${match.awayScore}` : "–:–"}
            </span>
            <TeamCol flag={match.awayTeam.flag} name={match.awayTeam.name} />
          </div>
          {!finished && locked && (
            <p className="mt-2 text-center text-[12px] text-ink-2">
              Resultat folgt nach Spielende
            </p>
          )}
        </div>

        {/* Tipps */}
        <section>
          <h2 className="mb-2 px-1 text-[20px] font-bold tracking-tight">
            {locked ? "Tipps deiner Gruppen" : "Dein Tipp"}
          </h2>
          {!locked && (
            <p className="mb-2 px-1 text-[13px] text-ink-2">
              Die Tipps der anderen werden nach Anpfiff sichtbar.
            </p>
          )}
          <div className="card divide-y divide-sep overflow-hidden">
            {tips.length === 0 && (
              <p className="p-5 text-center text-[14px] text-ink-2">
                {locked
                  ? "Niemand aus deinen Gruppen hat getippt."
                  : "Du hast noch keinen Tipp abgegeben."}
              </p>
            )}
            {tips.map((tip) => {
              const me = tip.user.id === session.userId;
              return (
                <div
                  key={tip.id}
                  className={`flex items-center gap-3 px-4 py-3 ${me ? "bg-tint-soft" : ""}`}
                >
                  <Avatar name={tip.user.username} emoji={tip.user.avatar} size={36} />
                  <span className={`flex-1 truncate text-[15px] ${me ? "font-bold" : "font-semibold"}`}>
                    {tip.user.username}{" "}
                    {me && <span className="text-[12px] text-tint">(du)</span>}
                  </span>
                  <span className="text-[17px] font-bold tabular-nums">
                    {tip.homeGoals}:{tip.awayGoals}
                  </span>
                  {tip.points !== null && (
                    <span
                      className={`w-12 rounded-full px-2 py-0.5 text-center text-[12px] font-bold ${
                        tip.points >= 3
                          ? "bg-green/15 text-green"
                          : tip.points > 0
                            ? "bg-orange/15 text-orange-deep"
                            : "bg-card-2 text-ink-2"
                      }`}
                    >
                      +{tip.points}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <Link
          href="/tipps"
          className="block text-center text-[15px] font-semibold text-tint"
        >
          ‹ Zurück zu den Tipps
        </Link>
      </div>
    </main>
  );
}

function TeamCol({ flag, name }: { flag: string; name: string }) {
  return (
    <div className="flex w-24 flex-col items-center gap-1">
      <span className="text-[44px] leading-none" aria-hidden>
        {flag}
      </span>
      <span className="text-center text-[14px] font-semibold leading-tight">
        {name}
      </span>
    </div>
  );
}
