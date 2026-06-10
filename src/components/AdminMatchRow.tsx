"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminMatch = {
  id: number;
  label: string;
  sub: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  isKnockout: boolean;
};

export type TeamOption = { id: string; name: string; flag: string };

export default function AdminMatchRow({
  match,
  teams,
}: {
  match: AdminMatch;
  teams: TeamOption[];
}) {
  const router = useRouter();
  const [home, setHome] = useState(match.homeScore?.toString() ?? "");
  const [away, setAway] = useState(match.awayScore?.toString() ?? "");
  const [homeTeam, setHomeTeam] = useState(match.homeTeamId ?? "");
  const [awayTeam, setAwayTeam] = useState(match.awayTeamId ?? "");
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");

  async function save(clear = false) {
    setState("busy");
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: match.id,
        homeScore: clear ? null : home === "" ? null : Number(home),
        awayScore: clear ? null : away === "" ? null : Number(away),
        ...(match.isKnockout ? { homeTeamId: homeTeam, awayTeamId: awayTeam } : {}),
      }),
    });
    setState(res.ok ? "ok" : "err");
    if (res.ok) router.refresh();
  }

  const input =
    "h-10 w-11 rounded-lg border border-sep bg-card-2 text-center text-[16px] font-bold outline-none focus:border-tint";
  const select =
    "min-w-0 flex-1 rounded-lg border border-sep bg-card-2 px-2 py-2 text-[14px] outline-none";

  return (
    <div className="card space-y-2 p-3.5">
      <div>
        <p className="text-[14px] font-semibold">{match.label}</p>
        <p className="text-[12px] text-ink-3">{match.sub}</p>
      </div>

      {match.isKnockout && (
        <div className="flex items-center gap-2">
          <select className={select} value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}>
            <option value="">Heim wählen …</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag} {t.name}
              </option>
            ))}
          </select>
          <select className={select} value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}>
            <option value="">Gast wählen …</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag} {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          className={input}
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="–"
          value={home}
          onChange={(e) => setHome(e.target.value)}
        />
        <span className="font-bold text-ink-3">:</span>
        <input
          className={input}
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="–"
          value={away}
          onChange={(e) => setAway(e.target.value)}
        />
        <button
          onClick={() => save()}
          disabled={state === "busy"}
          className="ml-auto rounded-lg bg-tint px-4 py-2 text-[14px] font-semibold text-white active:opacity-70 disabled:opacity-40"
        >
          Speichern
        </button>
        {match.homeScore !== null && (
          <button
            onClick={() => {
              setHome("");
              setAway("");
              save(true);
            }}
            disabled={state === "busy"}
            className="rounded-lg px-2 py-2 text-[13px] font-semibold text-red active:opacity-70"
          >
            Löschen
          </button>
        )}
      </div>

      {state === "ok" && (
        <p className="text-[12px] font-semibold text-green">✓ Gespeichert, Punkte neu berechnet</p>
      )}
      {state === "err" && (
        <p className="text-[12px] font-semibold text-red">Fehler beim Speichern</p>
      )}
    </div>
  );
}
