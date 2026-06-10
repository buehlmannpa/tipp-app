import { NextResponse } from "next/server";
import { syncResults } from "@/lib/resultSync";

// Backup-Trigger für den Resultat-Sync (Vercel Cron, s. vercel.json).
// Mit gesetztem CRON_SECRET nur mit passendem Bearer-Token aufrufbar.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  const result = await syncResults();
  return NextResponse.json({ ok: true, ...result });
}
