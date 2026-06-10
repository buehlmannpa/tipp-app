import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { code } = await req.json();
  const group = await prisma.group.findUnique({
    where: { inviteCode: (code ?? "").trim().toUpperCase() },
  });
  if (!group) {
    return NextResponse.json(
      { error: "Kein Tipp-Kreis mit diesem Code gefunden." },
      { status: 404 }
    );
  }

  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: session.userId, groupId: group.id } },
    update: {},
    create: { userId: session.userId, groupId: group.id },
  });

  return NextResponse.json({ ok: true, groupId: group.id });
}
