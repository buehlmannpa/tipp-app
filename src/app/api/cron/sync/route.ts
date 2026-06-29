import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncResults, fetchWcMatches, normTla } from "@/lib/resultSync";

// Backup-Trigger für den Resultat-Sync (Vercel Cron, s. vercel.json).
// Mit gesetztem CRON_SECRET nur mit passendem Bearer-Token aufrufbar.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  const result = await syncResults();

  // Read-only K.o.-Diagnose: vergleicht unsere Slots mit football-data
  const url = new URL(req.url);
  let debug: object | undefined;
  if (url.searchParams.get("ko") === "1") {
    const fmt = (d: Date) =>
      d.toLocaleString("de-CH", { timeZone: "Europe/Zurich", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const ours = await prisma.match.findMany({
      where: { stage: { not: "GROUP" } },
      orderBy: { kickoff: "asc" },
      select: { id: true, stage: true, homeTeamId: true, awayTeamId: true, kickoff: true },
    });
    const api = await fetchWcMatches();
    const apiKo = api
      .filter((m) => m.stage !== "GROUP_STAGE")
      .map((m) => ({
        stage: m.stage,
        home: normTla(m.homeTeam?.tla),
        away: normTla(m.awayTeam?.tla),
        when: fmt(new Date(m.utcDate)),
        status: m.status,
      }))
      .sort((a, b) => a.when.localeCompare(b.when));
    debug = {
      unsereLeeren: ours
        .filter((m) => !m.homeTeamId)
        .map((m) => ({ id: m.id, stage: m.stage, when: fmt(m.kickoff) })),
      unsereGefuellt: ours.filter((m) => m.homeTeamId).length,
      apiKo,
    };
  }

  return NextResponse.json({
    ok: true,
    ...result,
    apiKeyConfigured: Boolean(process.env.FOOTBALL_DATA_API_KEY),
    ...(debug ? { debug } : {}),
  });
}
