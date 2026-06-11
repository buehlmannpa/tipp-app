import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncResults, fetchWcMatches } from "@/lib/resultSync";
import { getLiveScore } from "@/lib/liveScore";

// Backup-Trigger für den Resultat-Sync (Vercel Cron, s. vercel.json).
// Mit gesetztem CRON_SECRET nur mit passendem Bearer-Token aufrufbar.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  const result = await syncResults();

  // Diagnose (?debug=1): ungecachte Probe gegen football-data.org
  const url = new URL(req.url);
  let debug: object | undefined;
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (url.searchParams.get("debug") === "1" && key) {
    try {
      const probe = await fetch(
        "https://api.football-data.org/v4/competitions/WC/matches?status=LIVE",
        {
          headers: { "X-Auth-Token": key },
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        }
      );
      // Exakt der Code-Pfad der Spielseite (gecachte Gesamtliste)
      const cachedList = await fetchWcMatches();
      const dbMatch1 = await prisma.match.findUnique({
        where: { id: 1 },
        select: { status: true, homeScore: true, awayScore: true },
      });
      const scoredTips = await prisma.tip.count({
        where: { matchId: 1, points: { not: null } },
      });
      const apiMatch1 = cachedList.find(
        (m) => m.homeTeam?.tla === "MEX" && m.awayTeam?.tla === "RSA"
      );
      debug = {
        apiHttpStatus: probe.status,
        cachedListLength: cachedList.length,
        liveScorePath: await getLiveScore("MEX", "RSA"),
        dbMatch1,
        scoredTips,
        apiMatch1: apiMatch1
          ? { status: apiMatch1.status, score: apiMatch1.score?.fullTime }
          : null,
        body: probe.ok
          ? (await probe.json()).matches?.map(
              (m: {
                homeTeam?: { tla?: string };
                awayTeam?: { tla?: string };
                status?: string;
                score?: { fullTime?: object };
              }) => ({
                home: m.homeTeam?.tla,
                away: m.awayTeam?.tla,
                status: m.status,
                score: m.score?.fullTime,
              })
            )
          : (await probe.text()).slice(0, 300),
      };
    } catch (e) {
      debug = { error: String(e) };
    }
  }

  return NextResponse.json({
    ok: true,
    ...result,
    apiKeyConfigured: Boolean(key),
    ...(debug ? { debug } : {}),
  });
}
