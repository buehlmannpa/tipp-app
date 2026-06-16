import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leaderboard } from "@/lib/leaderboard";
import Header from "@/components/Header";
import AvatarPicker from "@/components/AvatarPicker";
import LogoutButton from "@/components/LogoutButton";
import ChangePassword from "@/components/ChangePassword";
import PushToggle from "@/components/PushToggle";
import ThemeToggle from "@/components/ThemeToggle";
import InstallHint from "@/components/InstallHint";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = await requireUser();
  const [entries, groupCount] = await Promise.all([
    leaderboard(),
    prisma.groupMember.count({ where: { userId: user.id } }),
  ]);
  const me = entries.find((e) => e.userId === user.id);

  return (
    <main>
      <Header title="Profil" subtitle="Dein Account" />

      <div className="space-y-4 px-4">
        <div className="card flex items-center gap-4 p-4">
          <AvatarPicker name={user.username} initialAvatar={user.avatar} />
          <div>
            <p className="text-[19px] font-bold">{user.username}</p>
            <p className="text-[14px] text-ink-2">{user.email}</p>
            <p className="mt-0.5 text-[12px] text-ink-2">
              Avatar antippen für eine zufällige Figur
            </p>
            {user.isAdmin && (
              <span className="mt-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[12px] font-bold text-orange-deep">
                Admin
              </span>
            )}
          </div>
        </div>

        <div className="card divide-y divide-sep overflow-hidden">
          <Row label="Rang" value={me ? `#${me.rank}` : "–"} />
          <Row label="Punkte" value={`${me?.points ?? 0}`} />
          <Row label="Exakte Tipps" value={`${me?.exact ?? 0}`} />
          <Row label="Abgegebene Tipps" value={`${me?.tipped ?? 0}`} />
          <Row label="Gruppen" value={`${groupCount}`} />
        </div>

        <ThemeToggle />

        <PushToggle />

        {user.isAdmin && (
          <Link
            href="/admin"
            className="card flex items-center justify-between p-4 active:bg-card-2"
          >
            <div>
              <p className="text-[16px] font-semibold">⚙️ Verwaltung</p>
              <p className="text-[13px] text-ink-2">
                Resultate, K.o.-Paarungen und Benutzer verwalten
              </p>
            </div>
            <span className="text-ink-2">›</span>
          </Link>
        )}

        <ChangePassword />

        <InstallHint />

        <LogoutButton />
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[15px]">{label}</span>
      <span className="text-[15px] font-bold tabular-nums">{value}</span>
    </div>
  );
}
