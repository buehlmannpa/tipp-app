import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leaderboard } from "@/lib/leaderboard";
import Header from "@/components/Header";
import LeaderboardList from "@/components/LeaderboardList";

export const dynamic = "force-dynamic";

export default async function RanglistePage({
  searchParams,
}: {
  searchParams: Promise<{ gruppe?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const myGroups = await prisma.group.findMany({
    where: { members: { some: { userId: session.userId } } },
    include: { members: { select: { userId: true } } },
    orderBy: { createdAt: "asc" },
  });

  const selected = myGroups.find((g) => g.id === params.gruppe);
  const entries = await leaderboard(
    selected ? selected.members.map((m) => m.userId) : undefined
  );

  return (
    <main>
      <Header
        title="Rangliste"
        subtitle={selected ? selected.name : "Gesamtwertung"}
      />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link
          href="/rangliste"
          className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold ${
            !selected ? "bg-tint text-white" : "card text-ink-2"
          }`}
        >
          Alle Tipper
        </Link>
        {myGroups.map((g) => (
          <Link
            key={g.id}
            href={`/rangliste?gruppe=${g.id}`}
            className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold ${
              selected?.id === g.id ? "bg-tint text-white" : "card text-ink-2"
            }`}
          >
            {g.name}
          </Link>
        ))}
      </div>

      <div className="px-4">
        <LeaderboardList entries={entries} highlightUserId={session.userId} />
        <p className="px-2 pt-3 text-center text-[12px] text-ink-2">
          Exaktes Resultat 3 Punkte · richtige Tendenz 1 Punkt.
          <br />
          Bei Punktgleichheit zählt die Anzahl exakter Tipps.
        </p>
      </div>
    </main>
  );
}
