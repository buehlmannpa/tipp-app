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
