import type { LeaderboardEntry } from "@/lib/leaderboard";
import Avatar from "./Avatar";

const medals = ["🥇", "🥈", "🥉"];

export default function LeaderboardList({
  entries,
  highlightUserId,
}: {
  entries: LeaderboardEntry[];
  highlightUserId?: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="card p-6 text-center text-[14px] text-ink-2">
        Noch keine Teilnehmer.
      </div>
    );
  }

  return (
    <div className="card divide-y divide-sep overflow-hidden">
      {entries.map((e) => {
        const me = e.userId === highlightUserId;
        return (
          <div
            key={e.userId}
            className={`flex items-center gap-3 px-4 py-3 ${me ? "bg-tint-soft" : ""}`}
          >
            <span className="w-8 text-center text-[17px] font-bold tabular-nums">
              {e.rank <= 3 && e.points > 0 ? medals[e.rank - 1] : e.rank}
            </span>
            <Avatar name={e.username} emoji={e.avatar} size={36} />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[15px] ${me ? "font-bold" : "font-semibold"}`}>
                {e.username} {me && <span className="text-[12px] text-tint">(du)</span>}
              </p>
              <p className="text-[12px] text-ink-2">
                {e.exact}× exakt · {e.tendency}× Tendenz · {e.tipped} Tipps
              </p>
            </div>
            <span className="text-[17px] font-bold tabular-nums">{e.points}</span>
          </div>
        );
      })}
    </div>
  );
}
