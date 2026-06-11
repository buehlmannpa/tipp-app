// Punktesystem wie beim SRF-Tippspiel:
// exaktes Resultat = 3 Punkte, richtige Tendenz (Sieger/Remis) = 1 Punkt.
export const POINTS_EXACT = 3;
export const POINTS_TENDENCY = 1;

// Tippschluss: 1 Stunde vor Anpfiff. Wird serverseitig erzwungen –
// Manipulation im Browser (HTML/JS) kann den Check in /api/tips nicht umgehen.
export const TIP_LOCK_MS = 60 * 60 * 1000;

export function tipDeadline(kickoff: Date): Date {
  return new Date(kickoff.getTime() - TIP_LOCK_MS);
}

export function isTipLocked(kickoff: Date, now: Date = new Date()): boolean {
  return now >= tipDeadline(kickoff);
}

export function calcPoints(
  tipHome: number,
  tipAway: number,
  resHome: number,
  resAway: number
): number {
  if (tipHome === resHome && tipAway === resAway) return POINTS_EXACT;
  const tipSign = Math.sign(tipHome - tipAway);
  const resSign = Math.sign(resHome - resAway);
  if (tipSign === resSign) return POINTS_TENDENCY;
  return 0;
}
