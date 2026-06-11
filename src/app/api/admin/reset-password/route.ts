import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";

// Admin setzt ein temporäres Passwort für einen Benutzer (z. B. wenn vergessen).
// Das Temp-Passwort wird einmalig angezeigt; der Benutzer ändert es im Profil.
export async function POST(req: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Nur für Admins." }, { status: 403 });
  }

  const { userId } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
  }

  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const tempPassword = Array.from(
    { length: 10 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(tempPassword, 10) },
  });

  return NextResponse.json({ ok: true, tempPassword, username: user.username });
}
