"use client";

import { useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

const OPTIONS: { key: Theme; label: string; icon: string }[] = [
  { key: "light", label: "Hell", icon: "☀️" },
  { key: "dark", label: "Dunkel", icon: "🌙" },
  { key: "system", label: "System", icon: "⚙️" },
];

// Mini-Store über localStorage, ohne setState im Effect (Lint-konform)
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function getSnapshot(): Theme {
  const t = localStorage.getItem("theme");
  return t === "dark" || t === "light" ? t : "system";
}

function setTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  } else {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }
  listeners.forEach((cb) => cb());
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "system");

  return (
    <div className="card p-4">
      <p className="mb-3 text-[15px] font-semibold">🎨 Darstellung</p>
      <div className="flex gap-2 rounded-xl bg-card-2 p-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setTheme(opt.key)}
            aria-pressed={theme === opt.key}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2.5 text-[13px] font-semibold transition-colors ${
              theme === opt.key
                ? "bg-tint text-white shadow-sm"
                : "text-ink-2 active:opacity-70"
            }`}
          >
            <span className="text-[18px]">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
