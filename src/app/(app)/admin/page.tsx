import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtShort, fmtTime, STAGE_LABELS } from "@/lib/format";
import Header from "@/components/Header";
import AdminMatchRow, { type AdminMatch } from "@/components/AdminMatchRow";
import AdminUserRow from "@/components/AdminUserRow";
import AdminGroupRow, { type AdminGroup } from "@/components/AdminGroupRow";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  // Admin-Flag frisch aus der DB – nicht nur aus dem Session-Token
  const user = await requireUser();
  if (!user.isAdmin) redirect("/");
  const { filter = "uebersicht" } = await searchParams;

  const now = new Date();
  const filters = [
    { key: "uebersicht", label: "Übersicht" },
    { key: "faellig", label: "Fällig" },
    { key: "ko", label: "K.o.-Spiele" },
    { key: "alle", label: "Alle Spiele" },
    { key: "gruppen", label: "Gruppen" },
    { key: "benutzer", label: "Benutzer" },
  ];

  return (
    <main>
      <Header title="Verwaltung" subtitle="Admin-Dashboard" />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:flex-wrap md:overflow-visible md:px-0">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={`/admin?filter=${f.key}`}
            className={`shrink-0 rounded-full px-4 py-2.5 text-[14px] font-semibold ${
              filter === f.key ? "bg-tint text-white" : "card text-ink-2"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filter === "uebersicht" && <Overview now={now} />}
      {filter === "gruppen" && <Groups />}
      {filter === "benutzer" && <Users />}
      {["faellig", "ko", "alle"].includes(filter) && (
        <Matches filter={filter} now={now} />
      )}
    </main>
  );
}

// ---------- Übersicht ----------

async function Overview({ now }: { now: Date }) {
  const [
    userCount,
    groupCount,
    tipCount,
    finishedCount,
    matchCount,
    dueCount,
    pushCount,
    tipsToday,
    newestUsers,
    topGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.group.count(),
    prisma.tip.count(),
    prisma.match.count({ where: { status: "FINISHED" } }),
    prisma.match.count(),
    prisma.match.count({
      where: { status: { not: "FINISHED" }, kickoff: { lte: now } },
    }),
    prisma.pushSubscription.count(),
    prisma.tip.count({
      where: { updatedAt: { gte: new Date(now.getTime() - 24 * 3600 * 1000) } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, username: true, createdAt: true, isAdmin: true },
    }),
    prisma.group.findMany({
      orderBy: { members: { _count: "desc" } },
      take: 3,
      select: { id: true, name: true, _count: { select: { members: true } } },
    }),
  ]);

  return (
    <div className="space-y-4 px-4 md:space-y-6 md:px-0">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 md:gap-4">
        <StatCard label="Benutzer" value={userCount} accent="text-tint" />
        <StatCard label="Gruppen" value={groupCount} accent="text-tint" />
        <StatCard label="Tipps gesamt" value={tipCount} accent="text-green" />
        <StatCard label="Tipps (24 h)" value={tipsToday} accent="text-green" />
        <StatCard
          label="Resultate erfasst"
          value={`${finishedCount}/${matchCount}`}
          accent="text-gold"
        />
        <StatCard label="Push-Geräte" value={pushCount} accent="text-orange-deep" />
      </div>

      {dueCount > 0 && (
        <Link
          href="/admin?filter=faellig"
          className="card flex items-center justify-between p-4 active:bg-card-2"
        >
          <p className="text-[15px] font-semibold text-orange-deep">
            ⚠️ {dueCount} {dueCount === 1 ? "Spiel wartet" : "Spiele warten"} auf
            ein Resultat
          </p>
          <span className="text-ink-2">›</span>
        </Link>
      )}

      <section>
        <h2 className="mb-2 px-1 text-[18px] font-bold">Neuste Registrierungen</h2>
        <div className="card divide-y divide-sep overflow-hidden">
          {newestUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-semibold">
                {u.username}
                {u.isAdmin && (
                  <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-orange-deep">
                    Admin
                  </span>
                )}
              </span>
              <span className="text-[12px] text-ink-2">{fmtShort(u.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>

      {topGroups.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-[18px] font-bold">Grösste Gruppen</h2>
          <div className="card divide-y divide-sep overflow-hidden">
            {topGroups.map((g) => (
              <div key={g.id} className="flex items-center justify-between px-4 py-3">
                <span className="truncate text-[14px] font-semibold">{g.name}</span>
                <span className="text-[12px] text-ink-2">
                  {g._count.members} Mitglieder
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
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

// ---------- Gruppen ----------

async function Groups() {
  const groups = await prisma.group.findMany({
    include: {
      owner: { select: { username: true } },
      members: { include: { user: { select: { username: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-4 md:px-0">
      <div className="card divide-y divide-sep overflow-hidden">
        {groups.length === 0 && (
          <p className="p-6 text-center text-[14px] text-ink-2">
            Noch keine Gruppen vorhanden.
          </p>
        )}
        {groups.map((g) => {
          const adminGroup: AdminGroup = {
            id: g.id,
            name: g.name,
            inviteCode: g.inviteCode,
            ownerName: g.owner.username,
            createdAt: fmtShort(g.createdAt),
            members: g.members.map((m) => m.user.username),
          };
          return <AdminGroupRow key={g.id} group={adminGroup} />;
        })}
      </div>
      <p className="px-2 pt-3 text-center text-[12px] text-ink-2">
        Antippen zum Bearbeiten: umbenennen, Einladungscode erneuern oder löschen.
      </p>
    </div>
  );
}

// ---------- Benutzer ----------

async function Users() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true },
    orderBy: { username: "asc" },
  });

  return (
    <div className="px-4 md:px-0">
      <div className="card divide-y divide-sep overflow-hidden">
        {users.map((u) => (
          <AdminUserRow
            key={u.id}
            userId={u.id}
            username={u.username}
            email={u.email}
          />
        ))}
      </div>
      <p className="px-2 pt-3 text-center text-[12px] text-ink-2">
        Passwort-Reset erzeugt ein temporäres Passwort, das du der Person sicher
        weitergibst.
      </p>
    </div>
  );
}

// ---------- Spiele ----------

async function Matches({ filter, now }: { filter: string; now: Date }) {
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

  return (
    <div className="space-y-3 px-4 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 md:px-0">
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
  );
}
