"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const DISMISS_KEY = "install-banner-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const noopSubscribe = () => () => {};

// Plattform nur ermitteln, wenn der Banner überhaupt infrage kommt:
// Mobilgerät, im Browser (nicht installiert), nicht weggeklickt.
function platformSnapshot(): "ios" | "android" | null {
  if (
    localStorage.getItem(DISMISS_KEY) === "1" ||
    sessionStorage.getItem(DISMISS_KEY) === "1"
  ) {
    return null;
  }
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (standalone) return null;

  const isIpadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(navigator.userAgent) || isIpadOs) return "ios";
  if (/Android/i.test(navigator.userAgent)) return "android";
  return null; // Desktop/Laptop: kein Banner
}

// Hinweis zum Installieren auf dem Home-Bildschirm (nur Mobilgeräte).
export default function InstallBanner() {
  const platform = useSyncExternalStore(
    noopSubscribe,
    platformSnapshot,
    () => null // serverseitig nie rendern
  );
  const [dismissed, setDismissed] = useState(false);
  const [nativePrompt, setNativePrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setNativePrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (dismissed || !platform) return null;

  function closeForSession() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  function closeForever() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function installNative() {
    if (!nativePrompt) return;
    await nativePrompt.prompt();
    const { outcome } = await nativePrompt.userChoice;
    if (outcome === "accepted") closeForever();
  }

  return (
    <div className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-40 mb-20">
      <div className="glass mx-auto max-w-md rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-[28px] leading-none" aria-hidden>
            📲
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold">Als App installieren</p>
            {platform === "ios" ? (
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">
                Tippe in Safari auf <span className="font-semibold">Teilen</span>{" "}
                <span aria-hidden>⎋</span> und wähle{" "}
                <span className="font-semibold">«Zum Home-Bildschirm»</span> –
                für Vollbild und Tipp-Erinnerungen.
              </p>
            ) : (
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">
                {nativePrompt
                  ? "Installiere die App für Vollbild und Tipp-Erinnerungen."
                  : "Öffne das Chrome-Menü ⋮ und wähle «App installieren» bzw. «Zum Startbildschirm hinzufügen»."}
              </p>
            )}
            <div className="mt-2 flex items-center gap-4">
              {platform === "android" && nativePrompt && (
                <button
                  onClick={installNative}
                  className="rounded-full bg-tint px-4 py-1.5 text-[13px] font-semibold text-white active:opacity-70"
                >
                  Jetzt installieren
                </button>
              )}
              <button
                onClick={closeForever}
                className="text-[13px] font-semibold text-ink-2 underline-offset-2 active:opacity-70"
              >
                Diese Meldung nicht mehr anzeigen
              </button>
            </div>
          </div>
          <button
            onClick={closeForSession}
            aria-label="Hinweis schliessen"
            className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-[16px] text-ink-2 active:opacity-70"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
