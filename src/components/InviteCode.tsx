"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteCode({ code, groupName }: { code: string; groupName: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = `Tippe mit bei «${groupName}» im WM Tippspiel 2026! Einladungscode: ${code} – ${window.location.origin}`;
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={share}
      className="card flex w-full items-center justify-between p-4 active:opacity-70"
    >
      <div className="text-left">
        <p className="text-[13px] text-ink-2">Einladungscode</p>
        <p className="text-[24px] font-bold tracking-[0.3em]">{code}</p>
      </div>
      <span className="rounded-full bg-tint-soft px-3 py-1.5 text-[14px] font-semibold text-tint">
        {copied ? "Kopiert ✓" : "Teilen"}
      </span>
    </button>
  );
}

export function LeaveGroup({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function leave() {
    setBusy(true);
    await fetch("/api/groups/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    router.push("/gruppen");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        disabled={busy}
        className="w-full rounded-xl py-3 text-[15px] font-semibold text-red active:opacity-70 disabled:opacity-40"
      >
        Gruppe verlassen
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 pb-[max(env(safe-area-inset-bottom),12px)]"
          onClick={() => setConfirming(false)}
        >
          <div
            className="w-full max-w-md space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass overflow-hidden rounded-2xl">
              <p className="px-4 py-3 text-center text-[13px] text-ink-2">
                Deine Tipps bleiben erhalten, du verlierst aber den Zugriff auf
                diese Tipprunde.
              </p>
              <button
                onClick={leave}
                disabled={busy}
                className="w-full border-t border-sep py-3.5 text-[17px] font-semibold text-red active:opacity-70 disabled:opacity-40"
              >
                {busy ? "Verlasse Gruppe …" : "Gruppe verlassen"}
              </button>
            </div>
            <button
              onClick={() => setConfirming(false)}
              className="glass w-full rounded-2xl py-3.5 text-[17px] font-bold text-tint active:opacity-70"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </>
  );
}
