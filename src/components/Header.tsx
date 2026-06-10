import Link from "next/link";
import { getSession } from "@/lib/auth";
import Avatar from "./Avatar";

export default async function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const session = await getSession();

  return (
    <header className="flex items-end justify-between px-5 pt-[max(env(safe-area-inset-top),20px)] pb-2">
      <div>
        {subtitle && (
          <p className="text-[13px] font-medium uppercase tracking-wide text-ink-2">
            {subtitle}
          </p>
        )}
        <h1 className="text-[32px] font-bold tracking-tight">{title}</h1>
      </div>
      {session && (
        <Link href="/profil" aria-label="Profil öffnen" className="mb-1">
          <Avatar name={session.username} size={40} />
        </Link>
      )}
    </header>
  );
}
