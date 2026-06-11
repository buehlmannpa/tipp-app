import { requireSession } from "@/lib/auth";
import TabBar from "@/components/TabBar";
import AppShell from "@/components/AppShell";
import InstallBanner from "@/components/InstallBanner";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireSession();
  return (
    <div className="mx-auto max-w-md">
      <AppShell>
        <div className="pb-32">{children}</div>
      </AppShell>
      <InstallBanner />
      <TabBar />
    </div>
  );
}
