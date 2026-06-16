import { PrismaClient, Stage } from "@prisma/client";

const prisma = new PrismaClient();

// [id, deutscher Name, Flagge, Gruppe]
const teams: [string, string, string, string][] = [
  ["MEX", "Mexiko", "🇲🇽", "A"],
  ["RSA", "Südafrika", "🇿🇦", "A"],
  ["KOR", "Südkorea", "🇰🇷", "A"],
  ["CZE", "Tschechien", "🇨🇿", "A"],
  ["CAN", "Kanada", "🇨🇦", "B"],
  ["BIH", "Bosnien-Herz.", "🇧🇦", "B"],
  ["QAT", "Katar", "🇶🇦", "B"],
  ["SUI", "Schweiz", "🇨🇭", "B"],
  ["BRA", "Brasilien", "🇧🇷", "C"],
  ["MAR", "Marokko", "🇲🇦", "C"],
  ["HAI", "Haiti", "🇭🇹", "C"],
  ["SCO", "Schottland", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "C"],
  ["USA", "USA", "🇺🇸", "D"],
  ["PAR", "Paraguay", "🇵🇾", "D"],
  ["TUR", "Türkei", "🇹🇷", "D"],
  ["AUS", "Australien", "🇦🇺", "D"],
  ["GER", "Deutschland", "🇩🇪", "E"],
  ["CUW", "Curaçao", "🇨🇼", "E"],
  ["CIV", "Elfenbeinküste", "🇨🇮", "E"],
  ["ECU", "Ecuador", "🇪🇨", "E"],
  ["NED", "Niederlande", "🇳🇱", "F"],
  ["JPN", "Japan", "🇯🇵", "F"],
  ["SWE", "Schweden", "🇸🇪", "F"],
  ["TUN", "Tunesien", "🇹🇳", "F"],
  ["BEL", "Belgien", "🇧🇪", "G"],
  ["EGY", "Ägypten", "🇪🇬", "G"],
  ["IRN", "Iran", "🇮🇷", "G"],
  ["NZL", "Neuseeland", "🇳🇿", "G"],
  ["ESP", "Spanien", "🇪🇸", "H"],
  ["CPV", "Kap Verde", "🇨🇻", "H"],
  ["KSA", "Saudi-Arabien", "🇸🇦", "H"],
  ["URU", "Uruguay", "🇺🇾", "H"],
  ["FRA", "Frankreich", "🇫🇷", "I"],
  ["SEN", "Senegal", "🇸🇳", "I"],
  ["IRQ", "Irak", "🇮🇶", "I"],
  ["NOR", "Norwegen", "🇳🇴", "I"],
  ["ARG", "Argentinien", "🇦🇷", "J"],
  ["ALG", "Algerien", "🇩🇿", "J"],
  ["AUT", "Österreich", "🇦🇹", "J"],
  ["JOR", "Jordanien", "🇯🇴", "J"],
  ["POR", "Portugal", "🇵🇹", "K"],
  ["COD", "DR Kongo", "🇨🇩", "K"],
  ["UZB", "Usbekistan", "🇺🇿", "K"],
  ["COL", "Kolumbien", "🇨🇴", "K"],
  ["ENG", "England", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "L"],
  ["CRO", "Kroatien", "🇭🇷", "L"],
  ["GHA", "Ghana", "🇬🇭", "L"],
  ["PAN", "Panama", "🇵🇦", "L"],
];

// Anstoßzeiten in US Eastern Time (ET = UTC-4 im Juni) aus dem offiziellen Spielplan.
// Format: [Tag (Juni), Stunde ET, Heim, Gast, Stadt]
const groupMatches: [number, number, string, string, string][] = [
  [11, 15, "MEX", "RSA", "Mexiko-Stadt"],
  [11, 22, "KOR", "CZE", "Zapopan"],
  [12, 15, "CAN", "BIH", "Toronto"],
  [12, 21, "USA", "PAR", "Los Angeles"],
  [13, 15, "QAT", "SUI", "San Francisco"],
  [13, 18, "BRA", "MAR", "New York/NJ"],
  [13, 21, "HAI", "SCO", "Boston"],
  [14, 0, "AUS", "TUR", "Vancouver"],
  [14, 13, "GER", "CUW", "Houston"],
  [14, 16, "NED", "JPN", "Dallas"],
  [14, 19, "CIV", "ECU", "Philadelphia"],
  [14, 22, "SWE", "TUN", "Monterrey"],
  [15, 12, "ESP", "CPV", "Atlanta"],
  [15, 15, "BEL", "EGY", "Seattle"],
  [15, 18, "KSA", "URU", "Miami"],
  [15, 21, "IRN", "NZL", "Los Angeles"],
  [16, 15, "FRA", "SEN", "New York/NJ"],
  [16, 18, "IRQ", "NOR", "Boston"],
  [16, 21, "ARG", "ALG", "Kansas City"],
  [17, 0, "AUT", "JOR", "San Francisco"],
  [17, 13, "POR", "COD", "Houston"],
  [17, 16, "ENG", "CRO", "Dallas"],
  [17, 19, "GHA", "PAN", "Toronto"],
  [17, 22, "UZB", "COL", "Mexiko-Stadt"],
  [18, 12, "CZE", "RSA", "Atlanta"],
  [18, 15, "SUI", "BIH", "Los Angeles"],
  [18, 18, "CAN", "QAT", "Vancouver"],
  [18, 23, "MEX", "KOR", "Zapopan"],
  [19, 15, "USA", "AUS", "Seattle"],
  [19, 18, "SCO", "MAR", "Boston"],
  [19, 21, "BRA", "HAI", "Philadelphia"],
  [20, 0, "TUR", "PAR", "San Francisco"],
  [20, 13, "NED", "SWE", "Houston"],
  [20, 16, "GER", "CIV", "Toronto"],
  [20, 20, "ECU", "CUW", "Kansas City"],
  [21, 0, "TUN", "JPN", "Monterrey"],
  [21, 12, "ESP", "KSA", "Atlanta"],
  [21, 15, "BEL", "IRN", "Los Angeles"],
  [21, 18, "URU", "CPV", "Miami"],
  [21, 21, "NZL", "EGY", "Vancouver"],
  [22, 13, "ARG", "AUT", "Dallas"],
  [22, 17, "FRA", "IRQ", "Philadelphia"],
  [22, 20, "NOR", "SEN", "New York/NJ"],
  [22, 23, "JOR", "ALG", "San Francisco"],
  [23, 13, "POR", "UZB", "Houston"],
  [23, 16, "ENG", "GHA", "Boston"],
  [23, 19, "PAN", "CRO", "Toronto"],
  [23, 22, "COL", "COD", "Zapopan"],
  [24, 15, "SUI", "CAN", "Vancouver"],
  [24, 15, "BIH", "QAT", "Seattle"],
  [24, 18, "SCO", "BRA", "Miami"],
  [24, 18, "MAR", "HAI", "Atlanta"],
  [24, 21, "CZE", "MEX", "Mexiko-Stadt"],
  [24, 21, "RSA", "KOR", "Monterrey"],
  [25, 16, "ECU", "GER", "New York/NJ"],
  [25, 16, "CUW", "CIV", "Philadelphia"],
  [25, 19, "JPN", "SWE", "Dallas"],
  [25, 19, "TUN", "NED", "Kansas City"],
  [25, 22, "TUR", "USA", "Los Angeles"],
  [25, 22, "PAR", "AUS", "San Francisco"],
  [26, 15, "NOR", "FRA", "Boston"],
  [26, 15, "SEN", "IRQ", "Toronto"],
  [26, 20, "CPV", "KSA", "Houston"],
  [26, 20, "URU", "ESP", "Zapopan"],
  [26, 23, "EGY", "IRN", "Seattle"],
  [26, 23, "NZL", "BEL", "Vancouver"],
  [27, 17, "PAN", "ENG", "New York/NJ"],
  [27, 17, "CRO", "GHA", "Philadelphia"],
  [27, 19.5, "COL", "POR", "Miami"],
  [27, 19.5, "COD", "UZB", "Atlanta"],
  [27, 22, "ALG", "AUT", "Kansas City"],
  [27, 22, "JOR", "ARG", "Dallas"],
];

// K.o.-Spiele: Teams stehen erst nach der Gruppenphase fest (Admin trägt sie ein).
// [Monat, Tag, Stunde ET, Stage, Anzahl Spiele an dem Tag verteilt auf Städte]
const knockout: [number, number, Stage, string][] = [
  [28, 15, "ROUND_32", "Los Angeles"],
  [28, 18, "ROUND_32", "Houston"],
  [28, 21, "ROUND_32", "Boston"],
  [29, 15, "ROUND_32", "Mexiko-Stadt"],
  [29, 18, "ROUND_32", "Dallas"],
  [29, 21, "ROUND_32", "Atlanta"],
  [30, 15, "ROUND_32", "New York/NJ"],
  [30, 18, "ROUND_32", "Seattle"],
  [30, 21, "ROUND_32", "San Francisco"],
  [31, 15, "ROUND_32", "Toronto"], // 31 = 1. Juli
  [31, 18, "ROUND_32", "Philadelphia"],
  [31, 21, "ROUND_32", "Kansas City"],
  [32, 15, "ROUND_32", "Miami"],
  [32, 18, "ROUND_32", "Vancouver"],
  [33, 15, "ROUND_32", "Zapopan"],
  [33, 18, "ROUND_32", "Houston"],
  [34, 15, "ROUND_16", "Philadelphia"],
  [34, 18, "ROUND_16", "Houston"],
  [35, 15, "ROUND_16", "New York/NJ"],
  [35, 18, "ROUND_16", "Mexiko-Stadt"],
  [36, 15, "ROUND_16", "Dallas"],
  [36, 18, "ROUND_16", "Seattle"],
  [37, 15, "ROUND_16", "Atlanta"],
  [37, 18, "ROUND_16", "Vancouver"],
  [39, 16, "QUARTER", "Boston"],
  [40, 16, "QUARTER", "Los Angeles"],
  [41, 15, "QUARTER", "Kansas City"],
  [41, 18, "QUARTER", "Miami"],
  [44, 16, "SEMI", "Dallas"],
  [45, 16, "SEMI", "Atlanta"],
  [48, 16, "THIRD", "Miami"],
  [49, 15, "FINAL", "New York/NJ"],
];

const stageLabel: Record<string, string> = {
  ROUND_32: "Sechzehntelfinale",
  ROUND_16: "Achtelfinale",
  QUARTER: "Viertelfinale",
  SEMI: "Halbfinale",
  THIRD: "Spiel um Platz 3",
  FINAL: "Finale",
};

function kickoffUtc(dayJune: number, hourEt: number): Date {
  // dayJune > 30 läuft in den Juli; ET = UTC-4
  const minutes = Math.round((hourEt % 1) * 60);
  return new Date(Date.UTC(2026, 5, dayJune, Math.floor(hourEt) + 4, minutes));
}

async function main() {
  const teamGroup = new Map(teams.map((t) => [t[0], t[3]]));

  for (const [id, name, flag, groupLetter] of teams) {
    await prisma.team.upsert({
      where: { id },
      update: { name, flag, groupLetter },
      create: { id, name, flag, groupLetter },
    });
  }

  let matchId = 1;
  for (const [day, hour, home, away, city] of groupMatches) {
    await prisma.match.upsert({
      where: { id: matchId },
      update: {},
      create: {
        id: matchId,
        kickoff: kickoffUtc(day, hour),
        stage: "GROUP",
        groupLetter: teamGroup.get(home),
        homeTeamId: home,
        awayTeamId: away,
        city,
      },
    });
    matchId++;
  }

  const stageCount: Record<string, number> = {};
  for (const [day, hour, stage, city] of knockout) {
    stageCount[stage] = (stageCount[stage] ?? 0) + 1;
    const n = stageCount[stage];
    const suffix = stage === "FINAL" || stage === "THIRD" ? "" : ` ${n}`;
    await prisma.match.upsert({
      where: { id: matchId },
      update: {},
      create: {
        id: matchId,
        kickoff: kickoffUtc(day, hour),
        stage,
        homePlaceholder: `${stageLabel[stage]}${suffix}`,
        awayPlaceholder: "",
        city,
      },
    });
    matchId++;
  }

  console.log(`Seed fertig: ${teams.length} Teams, ${matchId - 1} Spiele.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
