import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Header from "@/components/Header";
import GroupActions from "@/components/GroupActions";

export const dynamic = "force-dynamic";

export default async function GruppenPage() {
  const session = await requireSession();

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: session.userId } } },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main>
      <Header title="Gruppen" subtitle="Deine Tipprunden" />

      <div className="space-y-4 px-4 md:grid md:grid-cols-[1.5fr_1fr] md:items-start md:gap-6 md:space-y-0 md:px-0">
        <div className="space-y-4">
          {groups.length > 0 && (
            <div className="card divide-y divide-sep overflow-hidden">
              {groups.map((g) => (
                <Link
                  key={g.id}
                  href={`/gruppen/${g.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 active:bg-card-2 md:py-4 md:hover:bg-card-2"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tint-soft text-[18px]">
                    👥
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold">{g.name}</p>
                    <p className="text-[13px] text-ink-2">
                      {g._count.members}{" "}
                      {g._count.members === 1 ? "Mitglied" : "Mitglieder"}
                      {g.ownerId === session.userId && " · von dir erstellt"}
                    </p>
                  </div>
                  <span className="text-ink-3">›</span>
                </Link>
              ))}
            </div>
          )}

          {groups.length === 0 && (
            <div className="card p-6 text-center">
              <p className="text-[15px] font-semibold">Noch keine Gruppe</p>
              <p className="mt-1 text-[13px] text-ink-2">
                Erstelle eine Tipprunde und lade Familie, Freunde oder das Büro mit
                dem Einladungscode ein.
              </p>
            </div>
          )}
        </div>

        <GroupActions />
      </div>
    </main>
  );
}
