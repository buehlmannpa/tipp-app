import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pushConfigured, sendPush } from "@/lib/push";

// Tipp-Erinnerung: benachrichtigt Benutzer mit fehlenden Tipps für Spiele,
// die innerhalb des Zeitfensters anstossen (Standard: bis Tagesende CH).
// Läuft täglich morgens via Vercel Cron (vercel.json); externe Scheduler
// können ?window=<Stunden> nutzen. Max. 1 Erinnerung pro Gerät und Tag.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ ok: true, sent: 0, note: "Push nicht konfiguriert." });
  }

  const url = new URL(req.url);
  const windowHours = Math.min(48, Number(url.searchParams.get("window")) || 18);
  const now = new Date();
  const until = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

  const upcoming = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      kickoff: { gt: now, lte: until },
      homeTeamId: { not: null },
    },
    include: { homeTeam: true, awayTeam: true, tips: { select: { userId: true } } },
    orderBy: { kickoff: "asc" },
  });
  if (upcoming.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  // Höchstens 1 Erinnerung pro Gerät und Kalendertag
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      OR: [{ lastNotifiedAt: null }, { lastNotifiedAt: { lt: startOfDay } }],
    },
  });

  let sent = 0;
  for (const sub of subscriptions) {
    const missing = upcoming.filter(
      (m) => !m.tips.some((t) => t.userId === sub.userId)
    );
    if (missing.length === 0) continue;

    const first = missing[0];
    const time = first.kickoff.toLocaleTimeString("de-CH", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Zurich",
    });
    const body =
      missing.length === 1
        ? `${first.homeTeam!.flag} ${first.homeTeam!.name} – ${first.awayTeam!.flag} ${first.awayTeam!.name} um ${time} Uhr. Tipp nicht vergessen!`
        : `${missing.length} Spiele ohne Tipp – das erste um ${time} Uhr (${first.homeTeam!.name} – ${first.awayTeam!.name}).`;

    const ok = await sendPush(sub, {
      title: "⚽️ Jetzt tippen!",
      body,
      url: "/tipps",
    });
    if (ok) {
      sent++;
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { lastNotifiedAt: now },
      });
    }
  }

  return NextResponse.json({ ok: true, sent, matches: upcoming.length });
}
