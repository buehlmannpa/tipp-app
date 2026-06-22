import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getAvatar } from "@/lib/profile";
import Avatar from "./Avatar";

export default async function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const session = await getSession();
  const avatar = session ? await getAvatar(session.userId) : null;

  return (
    <header className="flex items-end justify-between px-5 pt-[max(env(safe-area-inset-top),20px)] pb-2 md:px-0 md:pt-6 md:pb-5">
      <div>
        {subtitle && (
          <p className="text-[13px] font-medium uppercase tracking-wide text-ink-2 md:text-[12px]">
            {subtitle}
          </p>
        )}
        <h1 className="text-[32px] font-bold tracking-tight md:mt-0.5 md:text-[30px]">
          {title}
        </h1>
      </div>
      {session && (
        <Link
          href="/profil"
          aria-label="Profil öffnen"
          className="mb-1 md:hidden"
        >
          <Avatar name={session.username} emoji={avatar} size={40} />
        </Link>
      )}
    </header>
  );
}
