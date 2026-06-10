"use client";

import { useRef, useState } from "react";

export type TipCardMatch = {
  id: number;
  kickoffIso: string;
  time: string;
  city: string;
  badge: string;
  homeName: string;
  homeFlag: string;
  awayName: string;
  awayFlag: string;
  locked: boolean;
  homeScore: number | null;
  awayScore: number | null;
  tipHome: number | null;
  tipAway: number | null;
  points: number | null;
};

export default function TipCard({ match }: { match: TipCardMatch }) {
  const [home, setHome] = useState<string>(match.tipHome?.toString() ?? "");
  const [away, setAway] = useState<string>(match.tipAway?.toString() ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(h: string, a: string) {
    if (timer.current) clearTimeout(timer.current);
    if (h === "" || a === "") return;
    timer.current = setTimeout(async () => {
      setState("saving");
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          homeGoals: Number(h),
          awayGoals: Number(a),
        }),
      });
      setState(res.ok ? "saved" : "error");
    }, 500);
  }

  const finished = match.homeScore !== null;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between text-[12px] text-ink-2">
        <span className="rounded-full bg-tint-soft px-2 py-0.5 font-semibold text-tint">
          {match.badge}
        </span>
        <span>
          {match.time} · {match.city}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <TeamSide flag={match.homeFlag} name={match.homeName} align="left" />

        {match.locked ? (
          <div className="flex min-w-[84px] flex-col items-center">
            <span className="text-[22px] font-bold tabular-nums">
              {finished ? `${match.homeScore}:${match.awayScore}` : "–:–"}
            </span>
            {match.tipHome !== null && (
              <span className="text-[11px] text-ink-2">
                Tipp {match.tipHome}:{match.tipAway}
              </span>
            )}
            {match.points !== null && (
              <span
                className={`animate-pop mt-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  match.points >= 3
                    ? "bg-green/15 text-green"
                    : match.points > 0
                      ? "bg-orange/15 text-orange"
                      : "bg-card-2 text-ink-3"
                }`}
              >
                +{match.points} P.
              </span>
            )}
            {!finished && match.tipHome === null && (
              <span className="text-[11px] text-ink-3">kein Tipp</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <ScoreInput
              value={home}
              onChange={(v) => {
                setHome(v);
                scheduleSave(v, away);
              }}
            />
            <span className="text-[18px] font-semibold text-ink-3">:</span>
            <ScoreInput
              value={away}
              onChange={(v) => {
                setAway(v);
                scheduleSave(home, v);
              }}
            />
          </div>
        )}

        <TeamSide flag={match.awayFlag} name={match.awayName} align="right" />
      </div>

      {!match.locked && (
        <div className="mt-2 h-4 text-center text-[11px]">
          {state === "saving" && <span className="text-ink-3">Speichern …</span>}
          {state === "saved" && (
            <span className="animate-pop font-semibold text-green">✓ Tipp gespeichert</span>
          )}
          {state === "error" && (
            <span className="font-semibold text-red">Fehler beim Speichern</span>
          )}
        </div>
      )}
    </div>
  );
}

function TeamSide({
  flag,
  name,
  align,
}: {
  flag: string;
  name: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-1 ${
        align === "left" ? "" : ""
      }`}
    >
      <span className="text-[34px] leading-none">{flag}</span>
      <span className="text-center text-[13px] font-semibold leading-tight">
        {name}
      </span>
    </div>
  );
}

function ScoreInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={20}
      value={value}
      placeholder="–"
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || (/^\d{1,2}$/.test(v) && Number(v) <= 20)) onChange(v);
      }}
      className="h-12 w-12 rounded-xl border border-sep bg-card-2 text-center text-[20px] font-bold tabular-nums outline-none focus:border-tint focus:ring-2 focus:ring-tint/30"
    />
  );
}
