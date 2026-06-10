import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Captcha nicht konfiguriert → Prüfung übersprungen
  if (!token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(5000),
      }
    );
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const { email, username, password, turnstileToken } = await req.json();

  if (!(await verifyTurnstile(turnstileToken))) {
    return NextResponse.json(
      { error: "Bot-Schutz-Prüfung fehlgeschlagen. Bitte erneut versuchen." },
      { status: 403 }
    );
  }

  if (!email?.includes("@") || !username || username.length < 3 || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Bitte gültige E-Mail, Benutzername (min. 3 Zeichen) und Passwort (min. 8 Zeichen) angeben." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { username }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "E-Mail oder Benutzername ist bereits vergeben." },
      { status: 409 }
    );
  }

  // Der erste registrierte Benutzer wird automatisch Admin
  const isFirst = (await prisma.user.count()) === 0;
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username,
      passwordHash: await bcrypt.hash(password, 10),
      isAdmin: isFirst,
    },
  });

  await createSession({ userId: user.id, username: user.username, isAdmin: user.isAdmin });
  return NextResponse.json({ ok: true });
}
