"use client";

import { useEffect, useState } from "react";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "unsupported" | "off" | "on" | "denied" | "busy";

export default function PushToggle() {
  const [state, setState] = useState<State>("busy");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      if (!VAPID_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setState("busy");
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY!),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error();
      setState("on");
    } catch {
      setError("Aktivierung fehlgeschlagen. Bitte erneut versuchen.");
      setState("off");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  }

  if (state === "unsupported") {
    return (
      <div className="card p-4">
        <p className="text-[15px] font-semibold">🔔 Tipp-Erinnerungen</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
          Auf dem iPhone zuerst die App über <span className="font-semibold">Teilen →
          «Zum Home-Bildschirm»</span> installieren und von dort öffnen – dann
          lassen sich Erinnerungen hier aktivieren.
        </p>
      </div>
    );
  }

  return (
    <div className="card flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold">🔔 Tipp-Erinnerungen</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">
          {state === "on"
            ? "Aktiv – du wirst vor Spielen ohne Tipp erinnert."
            : state === "denied"
              ? "In den iOS-Einstellungen für diese App blockiert."
              : "Erinnert dich auf diesem Gerät, bevor Spiele ohne Tipp starten."}
        </p>
        {error && <p className="mt-1 text-[12px] font-semibold text-red">{error}</p>}
      </div>
      <button
        onClick={state === "on" ? disable : enable}
        disabled={state === "busy" || state === "denied"}
        role="switch"
        aria-checked={state === "on"}
        aria-label="Tipp-Erinnerungen"
        className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors disabled:opacity-40 ${
          state === "on" ? "bg-green" : "bg-card-2 border border-sep"
        }`}
      >
        <span
          className={`absolute top-0.5 h-7 w-7 rounded-full bg-white shadow transition-all ${
            state === "on" ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
