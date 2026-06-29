import type { Stage } from "@prisma/client";

export const TZ = "Europe/Zurich";

export const STAGE_LABELS: Record<Stage, string> = {
  GROUP: "Gruppenphase",
  ROUND_32: "Sechzehntelfinale",
  ROUND_16: "Achtelfinale",
  QUARTER: "Viertelfinale",
  SEMI: "Halbfinale",
  THIRD: "Spiel um Platz 3",
  FINAL: "Finale",
};

// Tippphasen statt starrer Kalenderwochen: Gruppenphase in 3 Spieltag-Fenster,
// danach jede K.o.-Runde als eigene Phase. Gruppenspiele werden per Datum
// zugeordnet, K.o.-Spiele per Stage – so wird keine Runde gesplittet oder
// mit der Gruppenphase vermischt.
export type TipPhase = {
  id: number;
  tab: string; // kurze Tab-Beschriftung
  label: string; // Titel im Eyebrow
  range: string; // Datumsspanne
  start: Date; // Beginn (für Erkennung der aktuellen Phase)
  group?: { start: Date; end: Date }; // nur Gruppenphasen: Abfragefenster
  stages?: Stage[]; // nur K.o.-Phasen: enthaltene Runden
};

const U = (month: number, day: number, hour = 0) =>
  new Date(Date.UTC(2026, month, day, hour));

export const PHASES: TipPhase[] = [
  {
    id: 1,
    tab: "Gruppe 1",
    label: "Gruppenphase · Spieltag 1",
    range: "11. – 17. Juni",
    start: U(5, 11),
    group: { start: U(5, 11), end: U(5, 18) },
  },
  {
    id: 2,
    tab: "Gruppe 2",
    label: "Gruppenphase · Spieltag 2",
    range: "18. – 24. Juni",
    start: U(5, 18),
    group: { start: U(5, 18), end: U(5, 25) },
  },
  {
    id: 3,
    tab: "Gruppe 3",
    label: "Gruppenphase · Spieltag 3",
    range: "25. – 27. Juni",
    start: U(5, 25),
    group: { start: U(5, 25), end: U(6, 2) },
  },
  {
    id: 4,
    tab: "Sechzehntel",
    label: "Sechzehntelfinale",
    range: "28. Juni – 3. Juli",
    start: U(5, 28),
    stages: ["ROUND_32"],
  },
  {
    id: 5,
    tab: "Achtelfinale",
    label: "Achtelfinale",
    range: "4. – 7. Juli",
    start: U(6, 4),
    stages: ["ROUND_16"],
  },
  {
    id: 6,
    tab: "Viertelfinale",
    label: "Viertelfinale",
    range: "9. – 11. Juli",
    start: U(6, 8),
    stages: ["QUARTER"],
  },
  {
    id: 7,
    tab: "Halbfinale",
    label: "Halbfinale",
    range: "14. – 15. Juli",
    start: U(6, 13),
    stages: ["SEMI"],
  },
  {
    id: 8,
    tab: "Finale",
    label: "Finalrunde",
    range: "18. – 19. Juli",
    start: U(6, 17),
    stages: ["THIRD", "FINAL"],
  },
];

export function getPhase(id: number): TipPhase {
  return PHASES.find((p) => p.id === id) ?? PHASES[0];
}

// Aktuelle Phase: die letzte, deren Beginn schon erreicht ist.
export function currentPhaseId(now: Date = new Date()): number {
  let id = PHASES[0].id;
  for (const p of PHASES) if (now.getTime() >= p.start.getTime()) id = p.id;
  return id;
}

// Phase eines Spiels: Gruppenspiele nach Datum, K.o.-Spiele nach Stage.
export function phaseIdOf(match: { stage: Stage; kickoff: Date }): number {
  if (match.stage !== "GROUP") {
    return PHASES.find((p) => p.stages?.includes(match.stage))?.id ?? 8;
  }
  const t = match.kickoff.getTime();
  for (const p of PHASES) {
    if (p.group && t >= p.group.start.getTime() && t < p.group.end.getTime()) {
      return p.id;
    }
  }
  return 3;
}

export function fmtDay(d: Date): string {
  return d.toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });
}

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function fmtShort(d: Date): string {
  return d.toLocaleDateString("de-CH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  });
}
