import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtShort, fmtTime, STAGE_LABELS } from "@/lib/format";
import AdminMatchRow, { type AdminMatch } from "@/components/AdminMatchRow";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requireSession();
  if (!session.isAdmin) redirect("/");
  const { filter = "faellig" } = await searchParams;

  const now = new Date();
  const where =
    filter === "alle"
      ? {}
      : filter === "ko"
        ? { stage: { not: "GROUP" as const } }
        : { kickoff: { lte: now }, status: { not: "FINISHED" as const } };

  const [matches, teams] = await Promise.all([
    prisma.match.findMany({
      where,
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoff: "asc" },
      take: 80,
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  const filters = [
    { key: "faellig", label: "Fällig" },
    { key: "ko", label: "K.o.-Spiele" },
    { key: "alle", label: "Alle" },
  ];

  return (
    <main>
      <header className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-2">
        <p className="text-[13px] font-medium uppercase tracking-wide text-ink-2">
          Resultate erfassen & Paarungen setzen
        </p>
        <h1 className="text-[32px] font-bold tracking-tight">Verwaltung</h1>
      </header>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={`/admin?filter=${f.key}`}
            className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold ${
              filter === f.key ? "bg-tint text-white" : "card text-ink-2"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3 px-4">
        {matches.length === 0 && (
          <div className="card p-8 text-center text-[14px] text-ink-2">
            Nichts zu erfassen – alles aktuell. 👍
          </div>
        )}
        {matches.map((m) => {
          const adminMatch: AdminMatch = {
            id: m.id,
            label: m.homeTeam
              ? `${m.homeTeam.flag} ${m.homeTeam.name} – ${m.awayTeam?.flag ?? ""} ${m.awayTeam?.name ?? "?"}`
              : (m.homePlaceholder ?? STAGE_LABELS[m.stage]),
            sub: `${fmtShort(m.kickoff)}, ${fmtTime(m.kickoff)} · ${
              m.stage === "GROUP" ? `Gruppe ${m.groupLetter}` : STAGE_LABELS[m.stage]
            }`,
            homeTeamId: m.homeTeamId,
            awayTeamId: m.awayTeamId,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            isKnockout: m.stage !== "GROUP",
          };
          return <AdminMatchRow key={m.id} match={adminMatch} teams={teams} />;
        })}
      </div>
    </main>
  );
}
