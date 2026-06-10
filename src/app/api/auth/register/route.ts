import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, username, password } = await req.json();

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
