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

// Geteilte Abfrage der relevanten WM-Spiele für Sync und Live-Anzeige.
// Wichtig: Die ungefilterte Gesamtliste wird bei football-data aggressiv
// gecacht und liefert während Live-Spielen veraltete Stände. Deshalb drei
// gezielte (frischere) Abfragen, zusammengeführt – Live/Beendet gewinnen.
// In-Memory-Cache 3 Min. pro Instanz; 3 Calls/3 Min. liegt weit unter dem
// Limit von 10 Anfragen/Minute.
let wcCache: { at: number; matches: ApiMatch[] } | null = null;
const WC_CACHE_MS = 3 * 60 * 1000;

async function apiGet(key: string, params: string): Promise<ApiMatch[]> {
  const res = await fetch(
    `https://api.football-data.org/v4/competitions/WC/matches${params}`,
    {
      headers: { "X-Auth-Token": key },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) {
    console.error(`football-data.org (${params}) antwortete mit ${res.status}`);
    return [];
  }
  const data = (await res.json()) as { matches?: ApiMatch[] };
  return data.matches ?? [];
}

function isoDay(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}

export async function fetchWcMatches(): Promise<ApiMatch[]> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) return [];
  if (wcCache && Date.now() - wcCache.at < WC_CACHE_MS) return wcCache.matches;

  const [windowed, finished, live] = await Promise.all([
    // Umfeld: gestern bis +6 Tage (deckt fällige Resultate und K.o.-Paarungen ab)
    apiGet(key, `?dateFrom=${isoDay(-2)}&dateTo=${isoDay(6)}`),
    apiGet(key, `?status=FINISHED&dateFrom=${isoDay(-2)}&dateTo=${isoDay(1)}`),
    apiGet(key, `?status=LIVE`),
  ]);

  if (windowed.length + finished.length + live.length === 0) {
    return wcCache?.matches ?? [];
  }

  // Zusammenführen pro Paarung; spätere Quellen (frischer) überschreiben
  const byPair = new Map<string, ApiMatch>();
  for (const list of [windowed, finished, live]) {
    for (const m of list) {
      const k = `${m.homeTeam?.tla}-${m.awayTeam?.tla}`;
      byPair.set(k, m);
    }
  }
  wcCache = { at: Date.now(), matches: [...byPair.values()] };
  return wcCache.matches;
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

  // K.o.-Platzhalter befüllen: pro Runde beide Listen (offene Slots und echte
  // Spiele mit bekannten Teams) nach Anstoss sortieren und der Reihe nach 1:1
  // paaren. Robust gegen abweichende Tagesverteilung – kein Slot bleibt leer,
  // solange football-data gleich viele Spiele wie Slots liefert.
  const KO_STAGES: Stage[] = [
    "ROUND_32",
    "ROUND_16",
    "QUARTER",
    "SEMI",
    "THIRD",
    "FINAL",
  ];
  for (const stage of KO_STAGES) {
    const open = (openByStage.get(stage) ?? [])
      .slice()
      .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
    if (open.length === 0) continue;

    const apiForStage = apiMatches
      .map((am) => ({
        am,
        home: norm(am.homeTeam?.tla),
        away: norm(am.awayTeam?.tla),
        t: new Date(am.utcDate).getTime(),
      }))
      .filter(
        (x) =>
          STAGE_MAP[x.am.stage] === stage &&
          x.home &&
          x.away &&
          teamIds.has(x.home) &&
          teamIds.has(x.away) &&
          !byPair.has(`${x.home}-${x.away}`) &&
          !byPair.has(`${x.away}-${x.home}`)
      )
      .sort((a, b) => a.t - b.t);

    const n = Math.min(open.length, apiForStage.length);
    for (let i = 0; i < n; i++) {
      const slot = open[i];
      const x = apiForStage[i];
      const m = await prisma.match.update({
        where: { id: slot.id },
        data: {
          homeTeamId: x.home,
          awayTeamId: x.away,
          kickoff: new Date(x.am.utcDate),
        },
      });
      byPair.set(`${x.home}-${x.away}`, m);
      updated++;
    }
  }

  // Resultate und Anstosszeiten aktualisieren
  for (const am of apiMatches) {
    const stage = STAGE_MAP[am.stage];
    const home = norm(am.homeTeam?.tla);
    const away = norm(am.awayTeam?.tla);
    if (!stage || !home || !away) continue;
    if (!teamIds.has(home) || !teamIds.has(away)) continue;

    const match = byPair.get(`${home}-${away}`) ?? byPair.get(`${away}-${home}`);
    if (!match) continue;

    // Anstosszeit selbstkorrigierend: football-data ist die Quelle der
    // Wahrheit. Weicht unsere gespeicherte Zeit um > 2 Min. ab, übernehmen
    // wir die echte Zeit (nur solange das Spiel noch nicht beendet ist).
    if (match.status !== "FINISHED") {
      const apiKickoff = new Date(am.utcDate);
      if (Math.abs(apiKickoff.getTime() - match.kickoff.getTime()) > 2 * 60 * 1000) {
        await prisma.match.update({
          where: { id: match.id },
          data: { kickoff: apiKickoff },
        });
        match.kickoff = apiKickoff;
        updated++;
      }
    }

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
