import type { Match, Stage } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { prisma } from "./db";
import { calcPoints } from "./scoring";
import { LEADERBOARD_TAG } from "./leaderboard";

// Automatischer Resultat-Sync via football-data.org (gratis, WM im Free-Tier).
// Läuft "lazy" bei App-Aufrufen, sobald ein Spiel fertig sein müsste, sowie als
// Cron-Backup über /api/cron/sync. Ohne FOOTBALL_DATA_API_KEY bleibt alles
// beim manuellen Admin-Workflow.

const STAGE_MAP: Record<string, Stage> = {
  GROUP_STAGE: "GROUP",
  LAST_32: "ROUND_32",
  LAST_16: "ROUND_16",
  QUARTER_FINALS: "QUARTER",
  SEMI_FINALS: "SEMI",
  THIRD_PLACE: "THIRD",
  FINAL: "FINAL",
};

// football-data nutzt teils ISO-Codes statt FIFA-Codes
const TLA_ALIAS: Record<string, string> = {
  NLD: "NED",
  DEU: "GER",
  CHE: "SUI",
  PRT: "POR",
  HRV: "CRO",
  DZA: "ALG",
  ZAF: "RSA",
  SAU: "KSA",
  PRY: "PAR",
  URY: "URU",
  HTI: "HAI",
};

export type ApiMatch = {
  utcDate: string;
  status: string;
  stage: string;
  homeTeam?: { tla?: string | null };
  awayTeam?: { tla?: string | null };
  score?: { fullTime?: { home: number | null; away: number | null } };
};

export function normTla(tla: string | null | undefined): string | null {
  if (!tla) return null;
  return TLA_ALIAS[tla] ?? tla;
}

const norm = normTla;

// Geteilte, 5 Minuten gecachte Abfrage aller WM-Spiele (Sync + Live-Anzeige
// nutzen denselben Next-Data-Cache – kostet kein zusätzliches API-Kontingent).
export async function fetchWcMatches(): Promise<ApiMatch[]> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) return [];
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches",
    {
      headers: { "X-Auth-Token": key },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) {
    console.error(`football-data.org antwortete mit ${res.status}`);
    return [];
  }
  const data = (await res.json()) as { matches?: ApiMatch[] };
  return data.matches ?? [];
}

async function rescoreMatch(matchId: number, home: number, away: number) {
  const tips = await prisma.tip.findMany({ where: { matchId } });
  await prisma.$transaction(
    tips.map((tip) =>
      prisma.tip.update({
        where: { id: tip.id },
        data: { points: calcPoints(tip.homeGoals, tip.awayGoals, home, away) },
      })
    )
  );
}

/**
 * Schneller Vorab-Check: Nur synchronisieren, wenn es etwas zu holen gibt –
 * ein angepfiffenes Spiel ohne Endstand oder eine offene K.o.-Paarung in den
 * nächsten Tagen. Sonst kostet der Aufruf nur einen Count-Query.
 */
// Pro warmer Serverless-Instanz höchstens alle 60 s prüfen
let lastCheck = 0;

export async function maybeSyncResults(): Promise<void> {
  if (!process.env.FOOTBALL_DATA_API_KEY) return;
  const now = Date.now();
  if (now - lastCheck < 60 * 1000) return;
  lastCheck = now;
  const due = await prisma.match.count({
    where: {
      OR: [
        // Anpfiff vor mehr als 105 Min. (Spielende naht/vorbei), Resultat fehlt
        {
          status: { not: "FINISHED" },
          kickoff: { lt: new Date(now - 105 * 60 * 1000) },
        },
        // K.o.-Spiel ohne Teams, Anstoss in < 5 Tagen
        {
          homeTeamId: null,
          kickoff: { lt: new Date(now + 5 * 24 * 60 * 60 * 1000) },
        },
      ],
    },
  });
  if (due === 0) return;
  try {
    await syncResults();
  } catch (e) {
    console.error("Resultat-Sync fehlgeschlagen:", e);
  }
}

export async function syncResults(): Promise<{ updated: number }> {
  const apiMatches = await fetchWcMatches();
  if (!apiMatches.length) return { updated: 0 };

  const [ourMatches, teams] = await Promise.all([
    prisma.match.findMany(),
    prisma.team.findMany({ select: { id: true } }),
  ]);
  const teamIds = new Set(teams.map((t) => t.id));
  const byPair = new Map<string, Match>();
  for (const m of ourMatches) {
    if (m.homeTeamId && m.awayTeamId)
      byPair.set(`${m.homeTeamId}-${m.awayTeamId}`, m);
  }
  // Offene K.o.-Platzhalter pro Stage, für die Zuordnung nach Anstosszeit
  const openByStage = new Map<Stage, Match[]>();
  for (const m of ourMatches) {
    if (!m.homeTeamId || !m.awayTeamId) {
      const list = openByStage.get(m.stage) ?? [];
      list.push(m);
      openByStage.set(m.stage, list);
    }
  }

  let updated = 0;

  for (const am of apiMatches) {
    const stage = STAGE_MAP[am.stage];
    const home = norm(am.homeTeam?.tla);
    const away = norm(am.awayTeam?.tla);
    if (!stage || !home || !away) continue;
    if (!teamIds.has(home) || !teamIds.has(away)) continue;

    let match = byPair.get(`${home}-${away}`) ?? byPair.get(`${away}-${home}`);

    // K.o.-Paarung einem Platzhalter zuordnen (gleiche Stage, nächstgelegener Anstoss)
    if (!match) {
      const apiKickoff = new Date(am.utcDate).getTime();
      const candidates = openByStage.get(stage) ?? [];
      let best: Match | undefined;
      let bestDiff = 48 * 60 * 60 * 1000; // max. 48h Abweichung
      for (const c of candidates) {
        const diff = Math.abs(c.kickoff.getTime() - apiKickoff);
        if (diff < bestDiff) {
          best = c;
          bestDiff = diff;
        }
      }
      if (best) {
        match = await prisma.match.update({
          where: { id: best.id },
          data: {
            homeTeamId: home,
            awayTeamId: away,
            kickoff: new Date(am.utcDate),
          },
        });
        openByStage.set(
          stage,
          candidates.filter((c) => c.id !== best.id)
        );
        byPair.set(`${home}-${away}`, match);
        updated++;
      }
    }
    if (!match) continue;

    // Endstand übernehmen und Punkte vergeben
    const ft = am.score?.fullTime;
    if (
      am.status === "FINISHED" &&
      ft?.home !== null &&
      ft?.home !== undefined &&
      ft?.away !== null &&
      ft?.away !== undefined
    ) {
      // Heim/Auswärts kann gegenüber unserem Seed gedreht sein
      const swapped = match.homeTeamId === away;
      const h = swapped ? ft.away : ft.home;
      const a = swapped ? ft.home : ft.away;
      if (
        match.status !== "FINISHED" ||
        match.homeScore !== h ||
        match.awayScore !== a
      ) {
        await prisma.match.update({
          where: { id: match.id },
          data: { homeScore: h, awayScore: a, status: "FINISHED" },
        });
        await rescoreMatch(match.id, h, a);
        updated++;
      }
    }
  }

  if (updated > 0) {
    revalidateTag(LEADERBOARD_TAG, "max");
    console.log(`Resultat-Sync: ${updated} Spiele aktualisiert.`);
  }
  return { updated };
}
