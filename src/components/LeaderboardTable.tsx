import type { LeaderboardEntry } from "@/lib/leaderboard";
import Avatar from "./Avatar";

// Desktop-Darstellung der Rangliste: Podium (Top 3) + Datentabelle.
// Wird nur ab md angezeigt (md:block), Mobile nutzt LeaderboardList.
export default function LeaderboardTable({
  entries,
  highlightUserId,
}: {
  entries: LeaderboardEntry[];
  highlightUserId?: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="card p-8 text-center text-[15px] text-ink-2">
        Noch keine Teilnehmer.
      </div>
    );
  }

  const hasPoints = entries[0]?.points > 0;
  const [first, second, third] = entries;
  // Podium-Reihenfolge: Silber, Gold (Mitte/höher), Bronze
  const podium = hasPoints
    ? [
        { e: second, medal: "🥈", cls: "" },
        { e: first, medal: "🥇", cls: "pod-gold" },
        { e: third, medal: "🥉", cls: "" },
      ].filter((p) => p.e)
    : [];

  return (
    <div>
      {podium.length === 3 && (
        <div className="mb-6 grid grid-cols-[1fr_1.12fr_1fr] items-end gap-4">
          {podium.map(({ e, medal, cls }) => (
            <div
              key={e.userId}
              className={`card flex flex-col items-center px-4 py-6 text-center ${
                cls === "pod-gold"
                  ? "border border-gold/60 bg-gradient-to-b from-gold/10 to-card"
                  : ""
              }`}
            >
              <span className="text-[32px]">{medal}</span>
              <span className="my-2">
                <Avatar name={e.username} emoji={e.avatar} size={54} />
              </span>
              <span className="text-[16px] font-extrabold">{e.username}</span>
              <span className="mt-1 text-[26px] font-extrabold tabular-nums tracking-tight">
                {e.points}
              </span>
              <span className="text-[12px] font-semibold text-ink-2">Punkte</span>
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[64px_1fr_90px_90px_90px_90px] border-b border-sep px-6 py-3.5 text-[12px] font-bold uppercase tracking-wide text-ink-3">
          <span className="text-center">Rang</span>
          <span>Spieler</span>
          <span className="text-center">Exakt</span>
          <span className="text-center">Tendenz</span>
          <span className="text-center">Tipps</span>
          <span className="text-center">Punkte</span>
        </div>
        {entries.map((e) => {
          const me = e.userId === highlightUserId;
          return (
            <div
              key={e.userId}
              className={`grid grid-cols-[64px_1fr_90px_90px_90px_90px] items-center border-t border-sep px-6 py-3.5 ${
                me ? "bg-tint-soft" : ""
              }`}
            >
              <span className="text-center text-[19px] font-bold tabular-nums">
                {e.rank <= 3 && e.points > 0 ? ["🥇", "🥈", "🥉"][e.rank - 1] : e.rank}
              </span>
              <span className="flex items-center gap-3 font-bold text-[15.5px]">
                <Avatar name={e.username} emoji={e.avatar} size={36} />
                {e.username}
                {me && <span className="text-[13px] font-semibold text-tint">(du)</span>}
              </span>
              <span className="text-center font-semibold tabular-nums text-ink-2">
                {e.exact}
              </span>
              <span className="text-center font-semibold tabular-nums text-ink-2">
                {e.tendency}
              </span>
              <span className="text-center font-semibold tabular-nums text-ink-2">
                {e.tipped}
              </span>
              <span className="text-center text-[17px] font-extrabold tabular-nums">
                {e.points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
