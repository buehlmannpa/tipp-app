import { prisma } from "./db";
import { pushConfigured, sendPush } from "./push";
import { tipDeadline, TIP_LOCK_MS } from "./scoring";
import { fmtTime } from "./format";

// «Gleich Tippschluss»-Warnung: Benachrichtigt Benutzer mit Push-Abo,
// die für ein Spiel noch keinen Tipp haben, wenn der Tippschluss
// (1 h vor Anpfiff) in den nächsten ~15 Minuten liegt.
// Pro Benutzer und Spiel wird höchstens einmal gewarnt (SentReminder).

const WARN_WINDOW_MS = 15 * 60 * 1000;

// Pro warmer Serverless-Instanz höchstens alle 60 s prüfen
let lastCheck = 0;

export async function maybeSendLockWarnings(): Promise<void> {
  if (!pushConfigured()) return;
  const now = Date.now();
  if (now - lastCheck < 60 * 1000) return;
  lastCheck = now;
  try {
    await sendLockWarnings();
  } catch (e) {
    console.error("Tippschluss-Warnung fehlgeschlagen:", e);
  }
}

export async function sendLockWarnings(): Promise<{ sent: number }> {
  if (!pushConfigured()) return { sent: 0 };
  const now = Date.now();

  // Spiele, deren Tippschluss noch nicht erreicht ist, aber innert 15 Min. fällt
  const matches = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      homeTeamId: { not: null },
      kickoff: {
        gt: new Date(now + TIP_LOCK_MS),
        lte: new Date(now + TIP_LOCK_MS + WARN_WINDOW_MS),
      },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      tips: { select: { userId: true } },
      reminders: { select: { userId: true } },
    },
  });
  if (matches.length === 0) return { sent: 0 };

  const subscriptions = await prisma.pushSubscription.findMany();
  let sent = 0;

  for (const match of matches) {
    const tipped = new Set(match.tips.map((t) => t.userId));
    const warned = new Set(match.reminders.map((r) => r.userId));
    const deadline = tipDeadline(match.kickoff);
    const minutes = Math.max(1, Math.round((deadline.getTime() - now) / 60000));

    // Geräte nach Benutzer gruppieren (mehrere Geräte möglich)
    const byUser = new Map<string, typeof subscriptions>();
    for (const sub of subscriptions) {
      if (tipped.has(sub.userId) || warned.has(sub.userId)) continue;
      const list = byUser.get(sub.userId) ?? [];
      list.push(sub);
      byUser.set(sub.userId, list);
    }

    for (const [userId, subs] of byUser) {
      let delivered = false;
      for (const sub of subs) {
        const ok = await sendPush(sub, {
          title: `⏰ Noch ${minutes} Min. zum Tippen!`,
          body: `${match.homeTeam!.flag} ${match.homeTeam!.name} – ${match.awayTeam!.flag} ${match.awayTeam!.name}: Tippschluss um ${fmtTime(deadline)} Uhr.`,
          url: "/tipps",
        });
        delivered = delivered || ok;
      }
      if (delivered) {
        sent++;
        await prisma.sentReminder
          .create({ data: { userId, matchId: match.id } })
          .catch(() => {});
      }
    }
  }

  if (sent > 0) console.log(`Tippschluss-Warnung: ${sent} Benutzer benachrichtigt.`);
  return { sent };
}
