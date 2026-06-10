"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GroupActions() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(url: string, body: object) {
    setBusy(true);
    setError("");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setName("");
      setCode("");
      router.push(`/gruppen/${data.groupId}`);
      router.refresh();
    } else {
      setError(data.error ?? "Etwas ist schiefgelaufen.");
    }
  }

  const field =
    "min-w-0 flex-1 rounded-xl border border-sep bg-card-2 px-4 py-3 text-[16px] outline-none placeholder:text-ink-3 focus:border-tint focus:ring-2 focus:ring-tint/30";
  const btn =
    "shrink-0 rounded-xl bg-tint px-4 py-3 text-[15px] font-semibold text-white active:opacity-70 disabled:opacity-40";

  return (
    <div className="space-y-3">
      <div className="card space-y-3 p-4">
        <h2 className="text-[16px] font-bold">Neue Gruppe erstellen</h2>
        <div className="flex gap-2">
          <input
            className={field}
            placeholder="Name, z. B. Büro-Tipprunde"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className={btn}
            disabled={busy || name.trim().length < 3}
            onClick={() => post("/api/groups", { name })}
          >
            Erstellen
          </button>
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <h2 className="text-[16px] font-bold">Gruppe beitreten</h2>
        <div className="flex gap-2">
          <input
            className={`${field} uppercase tracking-widest`}
            placeholder="Einladungscode"
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button
            className={btn}
            disabled={busy || code.trim().length < 6}
            onClick={() => post("/api/groups/join", { code })}
          >
            Beitreten
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red/10 px-4 py-3 text-[14px] font-medium text-red">
          {error}
        </p>
      )}
    </div>
  );
}
