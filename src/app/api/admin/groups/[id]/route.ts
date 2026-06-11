import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";

function inviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// Gruppe bearbeiten: umbenennen und/oder Einladungscode neu generieren (nur Admin)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Nur für Admins." }, { status: 403 });
  }
  const { id } = await params;
  const { name, regenerateCode } = await req.json();

  const data: { name?: string; inviteCode?: string } = {};
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 30) {
      return NextResponse.json(
        { error: "Gruppenname muss 3–30 Zeichen haben." },
        { status: 400 }
      );
    }
    data.name = name.trim();
  }
  if (regenerateCode) data.inviteCode = inviteCode();
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nichts zu ändern." }, { status: 400 });
  }

  const group = await prisma.group
    .update({ where: { id }, data })
    .catch(() => null);
  if (!group) {
    return NextResponse.json({ error: "Gruppe nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, name: group.name, inviteCode: group.inviteCode });
}

// Gruppe löschen (nur Admin) – Mitgliedschaften hängen per Cascade dran
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Nur für Admins." }, { status: 403 });
  }
  const { id } = await params;

  const group = await prisma.group.delete({ where: { id } }).catch(() => null);
  if (!group) {
    return NextResponse.json({ error: "Gruppe nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
