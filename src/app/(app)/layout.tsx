import { requireSession } from "@/lib/auth";
import { maybeSyncResults } from "@/lib/resultSync";
import TabBar from "@/components/TabBar";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireSession();
  // Holt fällige Resultate automatisch und vergibt Punkte (gedrosselt, s. resultSync.ts)
  await maybeSyncResults();
  return (
    <div className="mx-auto max-w-md">
      <div className="pb-32">{children}</div>
      <TabBar />
    </div>
  );
}
