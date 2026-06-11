import { NextResponse } from "next/server";
import { syncResults } from "@/lib/resultSync";

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
      debug = {
        apiHttpStatus: probe.status,
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
