"use client";

import { useState } from "react";

export default function AdminUserRow({
  userId,
  username,
  email,
}: {
  userId: string;
  username: string;
  email: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [temp, setTemp] = useState("");
  const [busy, setBusy] = useState(false);

  async function reset() {
    setBusy(true);
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setConfirming(false);
    if (res.ok) setTemp(data.tempPassword);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{username}</p>
        <p className="truncate text-[12px] text-ink-2">{email}</p>
      </div>
      {temp ? (
        <span className="rounded-lg bg-green/15 px-2.5 py-1.5 font-mono text-[13px] font-bold text-green">
          {temp}
        </span>
      ) : confirming ? (
        <>
          <button
            onClick={reset}
            disabled={busy}
            className="rounded-lg bg-red px-3 py-1.5 text-[13px] font-semibold text-white active:opacity-70 disabled:opacity-40"
          >
            {busy ? "…" : "Wirklich zurücksetzen"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg px-2 py-1.5 text-[13px] font-semibold text-tint"
          >
            Abbrechen
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="rounded-lg bg-card-2 px-3 py-1.5 text-[13px] font-semibold text-tint active:opacity-70"
        >
          Passwort-Reset
        </button>
      )}
      {temp && (
        <p className="w-full text-[11px] text-ink-2">
          Temp-Passwort sicher übermitteln – Benutzer ändert es danach im Profil.
        </p>
      )}
    </div>
  );
}
