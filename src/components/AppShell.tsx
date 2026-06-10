"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Client-Hülle für alle App-Screens:
// - registriert den Service Worker (Offline-Seite, Push)
// - aktualisiert Daten beim Zurückkehren in die App und alle 60 s (Live-Resultate)
// - Pull-to-Refresh per Touch-Geste
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const refresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setRefreshing(false);
      setPull(0);
    }, 600);
  }, [router]);

  // Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Auto-Refresh: bei Rückkehr in die App und periodisch, solange sichtbar
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [router]);

  // Pull-to-Refresh (nur am oberen Seitenrand)
  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY <= 0) startY.current = e.touches[0].clientY;
    else startY.current = null;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    setPull(Math.max(0, Math.min(90, delta * 0.5)));
  }
  function onTouchEnd() {
    if (pull >= 60 && !refreshing) refresh();
    else setPull(0);
    startY.current = null;
  }

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        aria-hidden
        className="flex items-center justify-center overflow-hidden transition-[height]"
        style={{ height: refreshing ? 44 : pull }}
      >
        <span
          className={`text-[13px] font-medium text-ink-2 ${refreshing ? "animate-pulse" : ""}`}
        >
          {refreshing ? "Aktualisieren …" : pull >= 60 ? "Loslassen" : "↓"}
        </span>
      </div>
      {children}
    </div>
  );
}
