import { prisma } from "./db";
import { POINTS_EXACT } from "./scoring";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  points: number;
  exact: number;
  tendency: number;
  tipped: number;
};

export async function leaderboard(userIds?: string[]): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: userIds ? { id: { in: userIds } } : undefined,
    select: {
      id: true,
      username: true,
      tips: { where: { points: { not: null } }, select: { points: true } },
      _count: { select: { tips: true } },
    },
  });

  const entries = users
    .map((u) => ({
      userId: u.id,
      username: u.username,
      points: u.tips.reduce((s, t) => s + (t.points ?? 0), 0),
      exact: u.tips.filter((t) => t.points === POINTS_EXACT).length,
      tendency: u.tips.filter((t) => t.points !== null && t.points > 0 && t.points < POINTS_EXACT).length,
      tipped: u._count.tips,
    }))
    .sort(
      (a, b) =>
        b.points - a.points || b.exact - a.exact || a.username.localeCompare(b.username)
    );

  let rank = 0;
  let prevPoints = -1;
  let prevExact = -1;
  return entries.map((e, i) => {
    if (e.points !== prevPoints || e.exact !== prevExact) {
      rank = i + 1;
      prevPoints = e.points;
      prevExact = e.exact;
    }
    return { ...e, rank };
  });
}
