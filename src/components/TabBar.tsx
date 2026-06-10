"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/tipps", label: "Tipps", icon: BallIcon },
  { href: "/rangliste", label: "Rangliste", icon: TrophyIcon },
  { href: "/gruppen", label: "Gruppen", icon: PeopleIcon },
  { href: "/news", label: "News", icon: NewsIcon },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-0 z-50 mb-[max(env(safe-area-inset-bottom),12px)]">
      <div className="glass mx-auto flex max-w-md items-center justify-between rounded-[28px] px-2 py-1.5">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-w-[60px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-all ${
                active ? "bg-tint-soft text-tint" : "text-ink-2"
              }`}
            >
              <Icon active={active} />
              <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

type IconProps = { active: boolean };
const stroke = (active: boolean) => ({
  fill: "none",
  stroke: "currentColor",
  strokeWidth: active ? 2.2 : 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke(active)}>
      <path d="M3.5 10.5 12 3.5l8.5 7v9a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function BallIcon({ active }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke(active)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.2 8.6 10.7l1.3 4h4.2l1.3-4z" />
      <path d="M12 3.5v4.7M5 7l3.6 3.7M19 7l-3.6 3.7M7.3 19.5l2.6-4.8M16.7 19.5l-2.6-4.8" />
    </svg>
  );
}

function TrophyIcon({ active }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke(active)}>
      <path d="M7 4h10v6a5 5 0 0 1-10 0z" />
      <path d="M7 5H4.5v1.5A3.5 3.5 0 0 0 8 10M17 5h2.5v1.5A3.5 3.5 0 0 1 16 10" />
      <path d="M12 15v3.5M8.5 20.5h7" />
    </svg>
  );
}

function PeopleIcon({ active }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke(active)}>
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="10" r="2.4" />
      <path d="M16 16.1a4.6 4.6 0 0 1 4.5 3.4" />
    </svg>
  );
}

function NewsIcon({ active }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke(active)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M7 9.5h6.5M7 13h10M7 16.5h10M16.5 9.5h.5" />
    </svg>
  );
}
