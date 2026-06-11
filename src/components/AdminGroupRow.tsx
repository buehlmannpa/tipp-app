"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminGroup = {
  id: string;
  name: string;
  inviteCode: string;
  ownerName: string;
  createdAt: string;
  members: string[];
};

export default function AdminGroupRow({ group }: { group: AdminGroup }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(group.name);
  const [code, setCode] = useState(group.inviteCode);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function patch(body: object) {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/admin/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      if (data.name) setName(data.name);
      if (data.inviteCode) setCode(data.inviteCode);
      setMsg("✓ Gespeichert");
      router.refresh();
    } else {
      setMsg(data.error ?? "Fehler");
    }
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/admin/groups/${group.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
    else setMsg("Löschen fehlgeschlagen");
  }

  const input =
    "min-w-0 flex-1 rounded-lg border border-sep bg-card-2 px-3 py-2 text-[14px] outline-none focus:border-tint";
  const btn =
    "shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold active:opacity-70 disabled:opacity-40";

  return (
    <div className="space-y-2 px-4 py-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{name}</p>
          <p className="truncate text-[12px] text-ink-2">
            von {group.ownerName} · {group.members.length}{" "}
            {group.members.length === 1 ? "Mitglied" : "Mitglieder"} · seit{" "}
            {group.createdAt} · Code{" "}
            <span className="font-mono font-bold">{code}</span>
          </p>
        </div>
        <span className="text-ink-2">{expanded ? "▴" : "▾"}</span>
      </button>

      {expanded && (
        <div className="space-y-2 rounded-xl bg-card-2 p-3">
          <p className="text-[12px] text-ink-2">
            Mitglieder: {group.members.join(", ") || "–"}
          </p>
          <div className="flex gap-2">
            <input
              className={input}
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              aria-label="Gruppenname"
            />
            <button
              className={`${btn} bg-tint text-white`}
              disabled={busy || name.trim().length < 3}
              onClick={() => patch({ name })}
            >
              Umbenennen
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`${btn} bg-card text-tint`}
              disabled={busy}
              onClick={() => patch({ regenerateCode: true })}
            >
              Neuen Code erzeugen
            </button>
            {confirming ? (
              <>
                <button
                  className={`${btn} bg-red text-white`}
                  disabled={busy}
                  onClick={remove}
                >
                  Endgültig löschen
                </button>
                <button
                  className={`${btn} text-tint`}
                  onClick={() => setConfirming(false)}
                >
                  Abbrechen
                </button>
              </>
            ) : (
              <button
                className={`${btn} text-red`}
                disabled={busy}
                onClick={() => setConfirming(true)}
              >
                Gruppe löschen
              </button>
            )}
            {msg && (
              <span className={`text-[12px] font-semibold ${msg.startsWith("✓") ? "text-green" : "text-red"}`}>
                {msg}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
