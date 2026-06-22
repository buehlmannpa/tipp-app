import { requireSession } from "@/lib/auth";
import { leaderboard } from "@/lib/leaderboard";
import { getAvatar } from "@/lib/profile";
import TabBar from "@/components/TabBar";
import Sidebar from "@/components/Sidebar";
import AppShell from "@/components/AppShell";
import InstallBanner from "@/components/InstallBanner";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const [avatar, entries] = await Promise.all([
    getAvatar(session.userId),
    leaderboard(),
  ]);
  const me = entries.find((e) => e.userId === session.userId);

  return (
    <div>
      {/* Desktop-Seitenleiste (auf Mobile ausgeblendet) */}
      <Sidebar
        username={session.username}
        avatar={avatar}
        isAdmin={session.isAdmin}
        rank={me?.rank ?? null}
        points={me?.points ?? 0}
      />

      {/* Inhalt: mobil zentriert (max-w-md), ab md neben der Sidebar */}
      <div className="md:pl-[264px]">
        <AppShell>
          <div className="mx-auto max-w-md pb-32 md:max-w-[1240px] md:px-8 md:pb-14">
            {children}
          </div>
        </AppShell>
      </div>

      <InstallBanner />
      <TabBar />
    </div>
  );
}
