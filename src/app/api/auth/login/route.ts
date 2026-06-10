import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: (email ?? "").toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(password ?? "", user.passwordHash))) {
    return NextResponse.json(
      { error: "E-Mail oder Passwort ist falsch." },
      { status: 401 }
    );
  }

  await createSession({ userId: user.id, username: user.username, isAdmin: user.isAdmin });
  return NextResponse.json({ ok: true });
}
