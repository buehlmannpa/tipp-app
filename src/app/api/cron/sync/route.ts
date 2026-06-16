import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncResults, fetchWcMatches } from "@/lib/resultSync";

// Backup-Trigger für den Resultat-Sync (Vercel Cron, s. vercel.json).
// Mit gesetztem CRON_SECRET nur mit passendem Bearer-Token aufrufbar.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  const result = await syncResults();

  // Diagnose (?schedule=1): Seed-Anstosszeiten vs. echte API-Zeiten vergleichen
  const url = new URL(req.url);
  const key = process.env.FOOTBALL_DATA_API_KEY;
  let debug: object | undefined;
  if (url.searchParams.get("schedule") === "1" && key) {
    try {
      const api = await fetchWcMatches();
      const ours = await prisma.match.findMany({
        where: { homeTeamId: { not: null }, awayTeamId: { not: null } },
        orderBy: { id: "asc" },
      });
      const diffs = ours.map((m) => {
        const am = api.find(
          (a) =>
            a.homeTeam?.tla === m.homeTeamId && a.awayTeam?.tla === m.awayTeamId
        );
        return {
          id: m.id,
          pair: `${m.homeTeamId}-${m.awayTeamId}`,
          db: m.kickoff.toISOString(),
          api: am ? am.utcDate : null,
          off: am
            ? Math.round(
                (new Date(am.utcDate).getTime() - m.kickoff.getTime()) / 60000
              )
            : null,
        };
      });
      const mismatches = diffs.filter((d) => d.off !== null && d.off !== 0);
      // Korrektur direkt anwenden (Diagnose + Fix in einem)
      let fixed = 0;
      if (url.searchParams.get("fix") === "1") {
        for (const d of mismatches) {
          if (d.api) {
            await prisma.match.update({
              where: { id: d.id },
              data: { kickoff: new Date(d.api) },
            });
            fixed++;
          }
        }
      }
      debug = { mismatches, fixed, apiCount: api.length };
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
