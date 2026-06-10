import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leaderboard } from "@/lib/leaderboard";
import LeaderboardList from "@/components/LeaderboardList";
import { InviteCode, LeaveGroup } from "@/components/InviteCode";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: { select: { userId: true } } },
  });
  if (!group || !group.members.some((m) => m.userId === session.userId)) {
    notFound();
  }

  const entries = await leaderboard(group.members.map((m) => m.userId));

  return (
    <main>
      <header className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-2">
        <p className="text-[13px] font-medium uppercase tracking-wide text-ink-2">
          Tipprunde · {group.members.length}{" "}
          {group.members.length === 1 ? "Mitglied" : "Mitglieder"}
        </p>
        <h1 className="text-[32px] font-bold tracking-tight">{group.name}</h1>
      </header>

      <div className="space-y-4 px-4">
        <InviteCode code={group.inviteCode} groupName={group.name} />
        <LeaderboardList entries={entries} highlightUserId={session.userId} />
        <LeaveGroup groupId={group.id} />
      </div>
    </main>
  );
}
