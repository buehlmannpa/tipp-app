import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isTipLocked } from "@/lib/scoring";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { matchId, homeGoals, awayGoals } = await req.json();
  const h = Number(homeGoals);
  const a = Number(awayGoals);
  if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0 || h > 20 || a > 20) {
    return NextResponse.json({ error: "Ungültiger Tipp." }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: Number(matchId) } });
  if (!match || !match.homeTeamId || !match.awayTeamId) {
    return NextResponse.json({ error: "Spiel nicht gefunden." }, { status: 404 });
  }
  // Massgeblich ist ausschliesslich diese Server-Prüfung – im Browser
  // freigeschaltete Eingabefelder ändern daran nichts.
  if (isTipLocked(match.kickoff) || match.status !== "SCHEDULED") {
    return NextResponse.json(
      { error: "Tippschluss: Tipps sind nur bis 1 Stunde vor Anpfiff möglich." },
      { status: 403 }
    );
  }

  await prisma.tip.upsert({
    where: { userId_matchId: { userId: session.userId, matchId: match.id } },
    update: { homeGoals: h, awayGoals: a },
    create: { userId: session.userId, matchId: match.id, homeGoals: h, awayGoals: a },
  });

  return NextResponse.json({ ok: true });
}
