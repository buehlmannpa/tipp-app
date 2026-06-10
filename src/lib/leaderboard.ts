import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { POINTS_EXACT, POINTS_TENDENCY } from "./scoring";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  points: number;
  exact: number;
  tendency: number;
  tipped: number;
};

export const LEADERBOARD_TAG = "leaderboard";

// Aggregation in der DB statt alle Tipps zu laden; global gecacht (60 s bzw.
// bis revalidateTag nach einer Resultat-Erfassung).
const cachedEntries = unstable_cache(
  async (): Promise<Omit<LeaderboardEntry, "rank">[]> => {
    const [users, sums, exacts, tendencies] = await Promise.all([
      prisma.user.findMany({ select: { id: true, username: true } }),
      prisma.tip.groupBy({
        by: ["userId"],
        _sum: { points: true },
        _count: { _all: true },
      }),
      prisma.tip.groupBy({
        by: ["userId"],
        where: { points: POINTS_EXACT },
        _count: { _all: true },
      }),
      prisma.tip.groupBy({
        by: ["userId"],
        where: { points: POINTS_TENDENCY },
        _count: { _all: true },
      }),
    ]);

    const sumMap = new Map(sums.map((s) => [s.userId, s]));
    const exactMap = new Map(exacts.map((e) => [e.userId, e._count._all]));
    const tendencyMap = new Map(tendencies.map((t) => [t.userId, t._count._all]));

    return users
      .map((u) => ({
        userId: u.id,
        username: u.username,
        points: sumMap.get(u.id)?._sum.points ?? 0,
        exact: exactMap.get(u.id) ?? 0,
        tendency: tendencyMap.get(u.id) ?? 0,
        tipped: sumMap.get(u.id)?._count._all ?? 0,
      }))
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.exact - a.exact ||
          a.username.localeCompare(b.username)
      );
  },
  ["leaderboard-entries"],
  { revalidate: 60, tags: [LEADERBOARD_TAG] }
);

export async function leaderboard(userIds?: string[]): Promise<LeaderboardEntry[]> {
  const all = await cachedEntries();
  const filtered = userIds
    ? all.filter((e) => userIds.includes(e.userId))
    : all;

  let rank = 0;
  let prevPoints = -1;
  let prevExact = -1;
  return filtered.map((e, i) => {
    if (e.points !== prevPoints || e.exact !== prevExact) {
      rank = i + 1;
      prevPoints = e.points;
      prevExact = e.exact;
    }
    return { ...e, rank };
  });
}
