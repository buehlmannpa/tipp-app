import { fetchWcMatches, normTla } from "./resultSync";

export type LiveScore = {
  home: number;
  away: number;
  paused: boolean;
};

// Aktueller Zwischenstand eines laufenden Spiels (max. 5 Min. alt, da die
// API-Antwort im Next-Data-Cache liegt). Ohne API-Key oder wenn das Spiel
// bei football-data nicht läuft: null.
export async function getLiveScore(
  homeTeamId: string,
  awayTeamId: string
): Promise<LiveScore | null> {
  try {
    const matches = await fetchWcMatches();
    const am = matches.find((m) => {
      const h = normTla(m.homeTeam?.tla);
      const a = normTla(m.awayTeam?.tla);
      return (
        (h === homeTeamId && a === awayTeamId) ||
        (h === awayTeamId && a === homeTeamId)
      );
    });
    if (!am || (am.status !== "IN_PLAY" && am.status !== "PAUSED")) return null;

    const swapped = normTla(am.homeTeam?.tla) === awayTeamId;
    const ft = am.score?.fullTime;
    return {
      home: (swapped ? ft?.away : ft?.home) ?? 0,
      away: (swapped ? ft?.home : ft?.away) ?? 0,
      paused: am.status === "PAUSED",
    };
  } catch {
    return null;
  }
}
