import { prisma } from "./db";
import { fmtDay, STAGE_LABELS, phaseIdOf } from "./format";

export type NewsItem = {
  id: string;
  date: Date;
  title: string;
  body: string;
  tag: string;
  href?: string;
};

type FinishedMatch = {
  id: number;
  kickoff: Date;
  stage: keyof typeof STAGE_LABELS;
  groupLetter: string | null;
  city: string;
  homeScore: number;
  awayScore: number;
  home: { name: string; flag: string };
  away: { name: string; flag: string };
};

function matchLine(m: FinishedMatch): string {
  return `${m.home.flag} ${m.home.name} ${m.homeScore}:${m.awayScore} ${m.away.flag} ${m.away.name}`;
}

function headline(m: FinishedMatch): string {
  const diff = m.homeScore - m.awayScore;
  const [winner, loser, wg, lg] =
    diff >= 0
      ? [m.home, m.away, m.homeScore, m.awayScore]
      : [m.away, m.home, m.awayScore, m.homeScore];
  if (diff === 0)
    return m.homeScore === 0
      ? `Torlose Nullnummer zwischen ${m.home.name} und ${m.away.name}`
      : `${m.home.name} und ${m.away.name} trennen sich ${m.homeScore}:${m.awayScore}`;
  if (Math.abs(diff) >= 3)
    return `${winner.flag} ${winner.name} fegt ${loser.name} mit ${wg}:${lg} vom Platz`;
  if (Math.abs(diff) === 1)
    return `${winner.flag} ${winner.name} ringt ${loser.name} knapp mit ${wg}:${lg} nieder`;
  return `${winner.flag} ${winner.name} setzt sich mit ${wg}:${lg} gegen ${loser.name} durch`;
}

export async function generateNews(): Promise<NewsItem[]> {
  const finished = await prisma.match.findMany({
    where: { status: "FINISHED", homeTeam: { isNot: null }, awayTeam: { isNot: null } },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "desc" },
    take: 40,
  });

  const items: NewsItem[] = finished.map((m) => ({
    id: `match-${m.id}`,
    date: m.kickoff,
    tag:
      m.stage === "GROUP" ? `Gruppe ${m.groupLetter}` : STAGE_LABELS[m.stage],
    title: headline({
      ...m,
      homeScore: m.homeScore!,
      awayScore: m.awayScore!,
      home: m.homeTeam!,
      away: m.awayTeam!,
    } as FinishedMatch),
    body: `${matchLine({
      ...m,
      homeScore: m.homeScore!,
      awayScore: m.awayScore!,
      home: m.homeTeam!,
      away: m.awayTeam!,
    } as FinishedMatch)} — ${STAGE_LABELS[m.stage]}${
      m.stage === "GROUP" ? ` (Gruppe ${m.groupLetter})` : ""
    } in ${m.city}, ${fmtDay(m.kickoff)}.`,
  }));

  // Vorschau auf die nächsten Spiele, solange es noch wenig Resultate gibt
  if (items.length < 5) {
    const upcoming = await prisma.match.findMany({
      where: { status: "SCHEDULED", kickoff: { gte: new Date() }, homeTeam: { isNot: null } },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoff: "asc" },
      take: 5 - items.length,
    });
    for (const m of upcoming) {
      items.push({
        id: `preview-${m.id}`,
        date: m.kickoff,
        tag: "Vorschau",
        href: `/tipps?woche=${phaseIdOf(m)}`,
        title: `${m.homeTeam!.flag} ${m.homeTeam!.name} trifft auf ${m.awayTeam!.flag} ${m.awayTeam!.name}`,
        body: `${STAGE_LABELS[m.stage]}${
          m.stage === "GROUP" ? ` (Gruppe ${m.groupLetter})` : ""
        } in ${m.city}, ${fmtDay(m.kickoff)}. Jetzt Tipp abgeben!`,
      });
    }
  }

  return items;
}
