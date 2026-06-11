import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isValidAvatar } from "@/lib/avatars";
import { LEADERBOARD_TAG } from "@/lib/leaderboard";

// Avatar setzen – nur Werte aus der vordefinierten Liste (kein Upload)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { avatar } = await req.json();
  if (avatar !== null && !isValidAvatar(avatar)) {
    return NextResponse.json({ error: "Ungültiger Avatar." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { avatar },
  });
  revalidateTag(LEADERBOARD_TAG, "max");

  return NextResponse.json({ ok: true, avatar });
}
