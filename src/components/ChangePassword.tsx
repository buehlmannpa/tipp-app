"use client";

import { useState } from "react";

export default function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Passwort geändert ✓" });
      setCurrent("");
      setNext("");
      setTimeout(() => setOpen(false), 1200);
    } else {
      setMsg({ ok: false, text: data.error ?? "Etwas ist schiefgelaufen." });
    }
  }

  const field =
    "w-full rounded-xl border border-sep bg-card-2 px-4 py-3 text-[16px] outline-none placeholder:text-ink-3 focus:border-tint focus:ring-2 focus:ring-tint/30";

  return (
    <div className="card p-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <span className="text-[16px] font-semibold">🔑 Passwort ändern</span>
        <span className="text-ink-2">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="mt-3 space-y-2.5">
          <input
            className={field}
            type="password"
            placeholder="Aktuelles Passwort"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
          <input
            className={field}
            type="password"
            placeholder="Neues Passwort (min. 8 Zeichen)"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            minLength={8}
            required
          />
          {msg && (
            <p
              className={`text-[13px] font-semibold ${msg.ok ? "text-green" : "text-red"}`}
            >
              {msg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-tint py-3 text-[15px] font-semibold text-white active:opacity-70 disabled:opacity-40"
          >
            Speichern
          </button>
        </form>
      )}
    </div>
  );
}
