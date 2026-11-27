import type { LeaderRow } from "@/lib/stats";

const medal = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ rows }: { rows: LeaderRow[] }) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(140,130,217,0.16)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Лидерборд команды</h2>
        <span className="text-xs font-bold uppercase tracking-wider text-[#2E2A4F]/45">
          7 дней
        </span>
      </div>

      {rows.length === 1 && (
        <p className="mb-3 rounded-2xl bg-[#F4F5FB] p-3 text-sm font-semibold text-[#2E2A4F]/65">
          Пока ты один. Отправь друзьям свой код, и начнётся соревнование 🏁
        </p>
      )}

      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
              r.isMe ? "bg-[#E7E4FA]" : "bg-[#F4F5FB]"
            }`}
          >
            <span className="w-7 text-center text-lg font-extrabold">
              {medal[i] ?? i + 1}
            </span>
            {r.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.image}
                alt=""
                width={36}
                height={36}
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-extrabold text-[#7B73D1]">
                {r.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-extrabold">
                {r.name}
                {r.isMe && " (ты)"}
              </div>
              <div className="text-xs font-semibold text-[#2E2A4F]/55">
                🔥 {r.streak} · всего {r.totalPoints}
              </div>
            </div>
            <div className="text-right font-extrabold text-[#7B73D1]">
              +{r.weekPoints}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs font-semibold text-[#2E2A4F]/45">
        Баллы: 읽기 и 듣기 верно +10, неверно +2, набор 쓰기 +20. Лимит 300 в день.
      </p>
    </section>
  );
}
