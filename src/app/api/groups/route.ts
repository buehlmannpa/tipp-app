import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function inviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { name } = await req.json();
  if (!name || name.trim().length < 3) {
    return NextResponse.json(
      { error: "Gruppenname muss mindestens 3 Zeichen haben." },
      { status: 400 }
    );
  }

  // Limite: max. 5 selbst erstellte Gruppen pro Benutzer (Admins ausgenommen)
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  if (!user.isAdmin) {
    const owned = await prisma.group.count({ where: { ownerId: user.id } });
    if (owned >= 5) {
      return NextResponse.json(
        {
          error:
            "Limite erreicht: Du kannst maximal 5 Gruppen erstellen. Lösche eine bestehende Gruppe (verlassen als letztes Mitglied) oder tritt Gruppen anderer bei.",
        },
        { status: 403 }
      );
    }
  }

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      inviteCode: inviteCode(),
      ownerId: session.userId,
      members: { create: { userId: session.userId } },
    },
  });

  return NextResponse.json({ ok: true, groupId: group.id, inviteCode: group.inviteCode });
}
