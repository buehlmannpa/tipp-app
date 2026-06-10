import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { groupId } = await req.json();
  await prisma.groupMember.deleteMany({
    where: { userId: session.userId, groupId },
  });

  // Leere Gruppen aufräumen
  const remaining = await prisma.groupMember.count({ where: { groupId } });
  if (remaining === 0) {
    await prisma.group.delete({ where: { id: groupId } }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
