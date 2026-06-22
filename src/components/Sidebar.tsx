"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Avatar from "./Avatar";

const tabs = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/tipps", label: "Tipps", icon: BallIcon },
  { href: "/rangliste", label: "Rangliste", icon: TrophyIcon },
  { href: "/gruppen", label: "Gruppen", icon: PeopleIcon },
  { href: "/news", label: "News", icon: NewsIcon },
];

// Desktop-Seitenleiste – ersetzt auf grossen Bildschirmen die mobile Tab-Bar.
// Auf Mobilgeräten via `hidden md:flex` komplett ausgeblendet.
export default function Sidebar({
  username,
  avatar,
  isAdmin,
  rank,
  points,
}: {
  username: string;
  avatar: string | null;
  isAdmin: boolean;
  rank: number | null;
  points: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-sep bg-card px-4 py-6 md:flex">
      <Link href="/" className="flex items-center gap-3 px-2">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={42}
          height={42}
          className="rounded-[13px]"
        />
        <div>
          <strong className="block text-[17px] font-bold tracking-tight">
            Tippspiel
          </strong>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
            WM 2026
          </span>
        </div>
      </Link>

      <nav className="mt-7 flex flex-col gap-1">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">
          Menü
        </p>
        {tabs.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors ${
                active ? "bg-tint-soft text-tint" : "text-ink-2 hover:bg-bg"
              }`}
            >
              <Icon active={active} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-sep pt-4">
        <Link
          href="/profil"
          className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-bg"
        >
          <Avatar name={username} emoji={avatar} size={38} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[14px] font-bold">
              <span className="truncate">{username}</span>
              {isAdmin && (
                <span className="shrink-0 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-extrabold text-orange-deep">
                  Admin
                </span>
              )}
            </div>
            <div className="text-[12px] text-ink-2">
              {rank ? `Rang #${rank} · ` : ""}
              {points} Punkte
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

type IconProps = { active: boolean };
const stroke = (active: boolean) => ({
  fill: "none",
  stroke: "currentColor",
  strokeWidth: active ? 2.2 : 1.85,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" {...stroke(active)}>
      <path d="M3.5 10.5 12 3.5l8.5 7v9a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function BallIcon({ active }: IconProps) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" {...stroke(active)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.2 8.6 10.7l1.3 4h4.2l1.3-4z" />
      <path d="M12 3.5v4.7M5 7l3.6 3.7M19 7l-3.6 3.7M7.3 19.5l2.6-4.8M16.7 19.5l-2.6-4.8" />
    </svg>
  );
}
function TrophyIcon({ active }: IconProps) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" {...stroke(active)}>
      <path d="M7 4h10v6a5 5 0 0 1-10 0z" />
      <path d="M7 5H4.5v1.5A3.5 3.5 0 0 0 8 10M17 5h2.5v1.5A3.5 3.5 0 0 1 16 10" />
      <path d="M12 15v3.5M8.5 20.5h7" />
    </svg>
  );
}
function PeopleIcon({ active }: IconProps) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" {...stroke(active)}>
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="10" r="2.4" />
      <path d="M16 16.1a4.6 4.6 0 0 1 4.5 3.4" />
    </svg>
  );
}
function NewsIcon({ active }: IconProps) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" {...stroke(active)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M7 9.5h6.5M7 13h10M7 16.5h10M16.5 9.5h.5" />
    </svg>
  );
}
