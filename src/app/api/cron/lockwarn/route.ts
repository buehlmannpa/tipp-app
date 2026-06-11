import { NextResponse } from "next/server";
import { sendLockWarnings } from "@/lib/lockwarn";

// Trigger für die «Gleich Tippschluss»-Warnung. Läuft automatisch bei
// App-Traffic (lazy); für garantierte Zustellung alle 5 Min. von einem
// externen Scheduler (z. B. cron-job.org) aufrufen lassen.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  const result = await sendLockWarnings();
  return NextResponse.json({ ok: true, ...result });
}
