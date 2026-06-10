"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

function isStandaloneSnapshot(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Install-Anleitung nur zeigen, wenn die App noch im Browser läuft
export default function InstallHint() {
  const standalone = useSyncExternalStore(
    noopSubscribe,
    isStandaloneSnapshot,
    () => true // serverseitig ausblenden, Client entscheidet nach Hydration
  );

  if (standalone) return null;

  return (
    <div className="card p-4">
      <p className="text-[15px] font-semibold">📲 Als App installieren</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
        Öffne diese Seite in Safari, tippe auf{" "}
        <span className="font-semibold">Teilen</span> und wähle{" "}
        <span className="font-semibold">«Zum Home-Bildschirm»</span>. Die App
        erscheint dann wie eine native App auf deinem iPhone – inklusive
        Tipp-Erinnerungen.
      </p>
    </div>
  );
}
