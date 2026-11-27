import type { ProfileStats } from "@/lib/stats";

const card =
  "rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(140,130,217,0.16)] sm:p-6";

function Stat({
  emoji,
  label,
  value,
  hint,
}: {
  emoji: string;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F4F5FB] p-4 shadow-[inset_0_-3px_0_rgba(0,0,0,0.04)]">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider text-[#2E2A4F]/50">
        {label}
      </div>
      {hint && <div className="mt-1 text-xs font-semibold text-[#7B73D1]">{hint}</div>}
    </div>
  );
}

function Bar({
  title,
  ko,
  koColor,
  right,
  pct,
  color,
}: {
  title: string;
  ko: string;
  koColor: string;
  right: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-bold">
        <span>
          {title}{" "}
          <span lang="ko" style={{ color: koColor }}>
            {ko}
          </span>
        </span>
        <span>{right}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#ECEAF8]">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, pct)}%`, background: color }}
        />
      </div>
    </div>
  );
}

const heatCls = (n: number) =>
  n === 0
    ? "bg-[#ECEAF8]"
    : n <= 2
      ? "bg-[#C9C4F0]"
      : n <= 5
        ? "bg-[#A89FF0]"
        : "bg-[#7B73D1]";

export default function Dashboard({ s }: { s: ProfileStats }) {
  const maxDay = Math.max(1, ...s.days14.map((d) => d.count));
  // сдвиг, чтобы первая колонка календаря начиналась с понедельника
  const lead = (new Date(`${s.heat[0].date}T12:00:00Z`).getUTCDay() + 6) % 7;
  const cells = [...Array(lead).fill(null), ...s.heat] as (
    | { date: string; count: number }
    | null
  )[];
  const pct = Math.round((s.level.into / s.level.need) * 100);

  return (
    <div className="space-y-6">
      {/* Сводка */}
      <section className={card}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Моя статистика</h2>
          <span className="rounded-full bg-[#E7E4FA] px-3 py-1 text-sm font-extrabold text-[#7B73D1]">
            Уровень {s.level.level}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            emoji="🔥"
            label="Стрик"
            value={`${s.streak} дн.`}
            hint={
              s.activeToday
                ? "Сегодня засчитан ✓"
                : s.streak
                  ? "Зайди сегодня!"
                  : "Начни сегодня"
            }
          />
          <Stat emoji="⭐" label="Баллы" value={s.points} hint={`+${s.weekPoints} за неделю`} />
          <Stat emoji="✅" label="Заданий" value={s.totalTasks} />
          <Stat
            emoji="🎯"
            label="Точность"
            value={s.accuracy === null ? "—" : `${s.accuracy}%`}
            hint={`Рекорд стрика: ${s.longestStreak}`}
          />
        </div>

        <div className="mt-5">
          <div className="mb-1 flex justify-between text-xs font-bold text-[#2E2A4F]/55">
            <span>До уровня {s.level.level + 1}</span>
            <span>
              {s.level.into} / {s.level.need}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#ECEAF8]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8C82D9] to-[#FF8A80]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      {/* График за 14 дней */}
      <section className={card}>
        <h2 className="mb-4 text-xl font-extrabold">Активность за 14 дней</h2>
        <div className="flex gap-1.5">
          {s.days14.map((d) => (
            <div
              key={d.date}
              className="flex flex-1 flex-col items-center gap-1"
              title={`${d.date}: ${d.count} зад., ${d.points} баллов`}
            >
              <div className="flex h-28 w-full items-end">
                <div
                  className={`w-full rounded-t-lg ${d.count ? "bg-[#8C82D9]" : "bg-[#ECEAF8]"}`}
                  style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-[#2E2A4F]/45">
                {d.date.slice(8)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Календарь + разделы */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className={card}>
          <h2 className="mb-4 text-xl font-extrabold">Календарь (12 недель)</h2>
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {cells.map((c, i) =>
              c ? (
                <div
                  key={c.date}
                  title={`${c.date}: ${c.count}`}
                  className={`aspect-square rounded-[4px] ${heatCls(c.count)}`}
                />
              ) : (
                <div key={`pad-${i}`} className="aspect-square" />
              ),
            )}
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-4 text-xl font-extrabold">По разделам</h2>
          <div className="space-y-4">
            <Bar
              title="Чтение"
              ko="읽기"
              koColor="#8C82D9"
              right={`${s.reading.count} зад. · ${s.reading.accuracy ?? 0}%`}
              pct={s.reading.accuracy ?? 0}
              color="#8C82D9"
            />
            <Bar
              title="Аудирование"
              ko="듣기"
              koColor="#FF8A80"
              right={`${s.listening.count} зад. · ${s.listening.accuracy ?? 0}%`}
              pct={s.listening.accuracy ?? 0}
              color="#FF8A80"
            />
            <Bar
              title="Письмо"
              ko="쓰기"
              koColor="#FFAB91"
              right={`${s.writing.count} наборов`}
              pct={s.writing.count * 5}
              color="#FFAB91"
            />
          </div>
        </section>
      </div>

      {/* Достижения */}
      <section className={card}>
        <h2 className="mb-4 text-xl font-extrabold">Достижения</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {s.badges.map((b) => (
            <div
              key={b.id}
              title={b.desc}
              className={`rounded-2xl p-3 text-center ${
                b.earned ? "bg-[#E7E4FA]" : "bg-[#F4F5FB] opacity-45 grayscale"
              }`}
            >
              <div className="text-3xl">{b.emoji}</div>
              <div className="mt-1 text-sm font-extrabold">{b.title}</div>
              <div className="text-[11px] font-semibold text-[#2E2A4F]/55">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
