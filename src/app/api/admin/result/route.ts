import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { calcPoints } from "@/lib/scoring";
import { LEADERBOARD_TAG } from "@/lib/leaderboard";

// Resultat erfassen und alle Tipps zu diesem Spiel neu bewerten
export async function POST(req: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Nur für Admins." }, { status: 403 });
  }

  const { matchId, homeScore, awayScore, homeTeamId, awayTeamId } = await req.json();
  const match = await prisma.match.findUnique({ where: { id: Number(matchId) } });
  if (!match) return NextResponse.json({ error: "Spiel nicht gefunden." }, { status: 404 });

  // K.o.-Spiele: Teams nachtragen
  if (homeTeamId !== undefined || awayTeamId !== undefined) {
    await prisma.match.update({
      where: { id: match.id },
      data: { homeTeamId: homeTeamId || null, awayTeamId: awayTeamId || null },
    });
  }

  if (homeScore === null || homeScore === undefined || homeScore === "") {
    // Resultat löschen → Spiel wieder offen, Punkte zurücksetzen
    await prisma.match.update({
      where: { id: match.id },
      data: { homeScore: null, awayScore: null, status: "SCHEDULED" },
    });
    await prisma.tip.updateMany({ where: { matchId: match.id }, data: { points: null } });
    revalidateTag(LEADERBOARD_TAG, "max");
    return NextResponse.json({ ok: true });
  }

  const h = Number(homeScore);
  const a = Number(awayScore);
  if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
    return NextResponse.json({ error: "Ungültiges Resultat." }, { status: 400 });
  }

  await prisma.match.update({
    where: { id: match.id },
    data: { homeScore: h, awayScore: a, status: "FINISHED" },
  });

  const tips = await prisma.tip.findMany({ where: { matchId: match.id } });
  await prisma.$transaction(
    tips.map((tip) =>
      prisma.tip.update({
        where: { id: tip.id },
        data: { points: calcPoints(tip.homeGoals, tip.awayGoals, h, a) },
      })
    )
  );

  revalidateTag(LEADERBOARD_TAG, "max");
  return NextResponse.json({ ok: true, scored: tips.length });
}
