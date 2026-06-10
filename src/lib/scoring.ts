// Punktesystem wie beim SRF-Tippspiel:
// exaktes Resultat = 3 Punkte, richtige Tendenz (Sieger/Remis) = 1 Punkt.
export const POINTS_EXACT = 3;
export const POINTS_TENDENCY = 1;

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
