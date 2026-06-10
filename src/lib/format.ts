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

// Turnierstart: 11. Juni 2026. Tippwochen laufen Do–Mi wie beim SRF-Tippspiel.
const WEEK_START = Date.UTC(2026, 5, 11);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function weekOf(kickoff: Date): number {
  return Math.max(
    1,
    Math.min(6, Math.floor((kickoff.getTime() - WEEK_START) / WEEK_MS) + 1)
  );
}

export function weekRangeLabel(week: number): string {
  const start = new Date(WEEK_START + (week - 1) * WEEK_MS);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("de-CH", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(start)} – ${fmt(end)}`;
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
