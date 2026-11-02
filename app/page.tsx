import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import mascot from "../public/mascot.png";

/* ---------- Мелкие декоративные элементы ---------- */

function Sparkle({
  className = "",
  color = "#8C82D9",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 1c.8 5.6 3.4 9.2 11 11-7.6 1.8-10.2 5.4-11 11-.8-5.6-3.4-9.2-11-11C8.6 10.2 11.2 6.6 12 1z"
        fill={color}
      />
    </svg>
  );
}

function Squiggle({
  className = "",
  color = "#FF8A80",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 12"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d="M2 6q7.5-8 15 0t15 0 15 0 15 0 15 0 15 0 15 0 15 0"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Bubble({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      lang="ko"
      aria-hidden="true"
      className={`absolute flex items-center justify-center rounded-2xl bg-white font-extrabold shadow-[0_8px_20px_rgba(140,130,217,0.22),inset_0_-3px_0_rgba(0,0,0,0.05)] ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------- Иллюстрации ---------- */
function BookArt() {
  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24" aria-hidden="true">
      <rect x="10" y="22" width="76" height="54" rx="12" fill="#7B73D1" />
      <rect x="16" y="16" width="32" height="56" rx="8" fill="#fff" />
      <rect x="48" y="16" width="32" height="56" rx="8" fill="#F4F5FB" />
      <path
        d="M24 30h16M24 40h16M24 50h10"
        stroke="#8C82D9"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M56 30h16M56 40h12"
        stroke="#C9C4F0"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M62 8v22l6-5 6 5V8z" fill="#FF8A80" />
    </svg>
  );
}

function HeadphonesArt() {
  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24" aria-hidden="true">
      <path
        d="M20 58V48a28 28 0 0156 0v10"
        stroke="#7B73D1"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="12" y="52" width="22" height="30" rx="11" fill="#FF8A80" />
      <rect x="62" y="52" width="22" height="30" rx="11" fill="#FF8A80" />
      <rect
        x="18"
        y="58"
        width="10"
        height="18"
        rx="5"
        fill="#fff"
        opacity=".55"
      />
      <rect
        x="68"
        y="58"
        width="10"
        height="18"
        rx="5"
        fill="#fff"
        opacity=".55"
      />
    </svg>
  );
}

function PencilArt() {
  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24" aria-hidden="true">
      <g transform="rotate(40 48 48)">
        <rect x="38" y="6" width="20" height="14" rx="6" fill="#FF8A80" />
        <rect x="38" y="18" width="20" height="46" fill="#8C82D9" />
        <rect x="44" y="18" width="5" height="46" fill="#fff" opacity=".3" />
        <path d="M38 64h20L48 86z" fill="#FFE3D6" />
        <path d="M43.5 76h9L48 86z" fill="#2E2A4F" />
      </g>
      <path
        d="M10 84q10-8 20 0t20 0"
        stroke="#C9C4F0"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ---------- Данные ---------- */

type Section = {
  href: string;
  ko: string;
  glyph: string;
  title: string;
  desc: string;
  chips?: string[];
  tile: string;
  accent: string;
  art: ReactNode;
};

const sections: Section[] = [
  {
    href: "/reading",
    ko: "읽기",
    glyph: "읽",
    title: "Чтение",
    desc: "Короткие тексты и вопросы на понимание.",
    tile: "bg-[#E7E4FA]",
    accent: "#8C82D9",
    art: <BookArt />,
  },
  {
    href: "/listening",
    ko: "듣기",
    glyph: "듣",
    title: "Аудирование",
    desc: "Слушай диалоги и выбирай верный ответ.",
    tile: "bg-[#FFE0DC]",
    accent: "#FF8A80",
    art: <HeadphonesArt />,
  },
  {
    href: "/writing",
    ko: "쓰기",
    glyph: "쓰",
    title: "Письмо",
    desc: "Пиши ответы на задания по грамматике.",
    chips: ["Задание 51", "Задание 52"],
    tile: "bg-[#c9ffeb]",
    accent: "#FFAB91",
    art: <PencilArt />,
  },
];

const perks = ["Свежие задания", "Пояснения на каждом шаге", "Без ограничений"];
export const instant = false;

/* ---------- Страница ---------- */
export default async function Home() {
  const session = await auth();
  const user = session?.user;

  const initial = (user?.name ?? user?.email ?? "?")
    .trim()
    .charAt(0)
    .toUpperCase();
  const raw = user?.name?.split(" ")[0] ?? "ученик";
  // const firstName = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* фон: мягкие пятна + точечная сетка */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(140,130,217,0.22)_1.5px,transparent_1.5px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#8C82D9]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-64 h-72 w-72 rounded-full bg-[#FFAB91]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[#8C82D9]/10 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-10 sm:px-8">
        {/* шапка */}

        {/* hero */}
        {user ? (
          <section className="relative mt-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#a89ff0] to-[#7B73D1] p-6 text-white shadow-[0_16px_36px_rgba(140,130,217,0.35),inset_0_-6px_0_rgba(0,0,0,0.08)] sm:p-8">
            {/* декор */}
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-14 right-28 h-32 w-32 rounded-full bg-[#FF8A80]/30"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.35)_1.5px,transparent_1.5px)] [background-size:22px_22px]"
            />
            <Sparkle
              className="absolute right-40 top-5 hidden h-5 w-5 motion-safe:animate-pulse sm:block"
              color="#FFAB91"
            />
            <Sparkle
              className="absolute bottom-6 left-1/2 hidden h-4 w-4 sm:block"
              color="#fff"
            />

            <div className="relative flex items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                <div className="shrink-0 rounded-full bg-white/90 p-1 shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt=""
                      width={72}
                      height={72}
                      referrerPolicy="no-referrer"
                      className="h-14 w-14 rounded-full object-cover sm:h-[72px] sm:w-[72px]"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7E4FA] text-2xl font-extrabold text-[#7B73D1] sm:h-[72px] sm:w-[72px]">
                      {initial}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-extrabold leading-tight sm:text-4xl">
                    Привет, {user.name}!
                  </h1>
                  <p className="mt-1 font-semibold  md:block text-white">
                    Выбирай раздел и продолжай готовиться к TOPIK&nbsp;II
                  </p>
                </div>
              </div>

              <div className="animate-float hidden shrink-0 sm:block">
                <img src={mascot.src} alt="" width={140} height={140} />
              </div>
            </div>
          </section>
        ) : (
          <section className="grid flex-1 content-center gap-10 py-12 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h1 className="max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                Готовься к TOPIK&nbsp;II шаг за шагом
              </h1>
              <Squiggle className="mt-3 h-3 w-28" />
              <p className="mt-5 max-w-md text-lg font-semibold leading-relaxed text-[#2E2A4F]/65">
                В твоем распоряжении - большое количество свежих заданий с
                детальными пояснениями и помощью на каждом шаге. Выбирай раздел
                и начинай заниматься без ограничений!
              </p>

              <ul className="mt-6 flex flex-wrap gap-2.5">
                {perks.map((p, i) => (
                  <li
                    key={p}
                    className="flex items-center gap-2 rounded-full bg-white py-2 pl-3 pr-4 text-sm font-bold shadow-[0_6px_16px_rgba(0,0,0,0.05),inset_0_-3px_0_rgba(0,0,0,0.04)]"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${i === 1 ? "bg-[#FF8A80]" : "bg-[#8C82D9]"}`}
                      aria-hidden="true"
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* маскот на «глиняной» площадке с пузырями */}
            <div className="relative hidden h-[300px] w-[300px] justify-self-center md:block">
              <div
                aria-hidden="true"
                className="absolute inset-4 rounded-full bg-[#E7E4FA] shadow-[inset_0_-14px_0_rgba(123,115,209,0.14),inset_0_10px_0_rgba(255,255,255,0.7)]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full border-2 border-dashed border-[#8C82D9]/30"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <img src={mascot.src} alt="" width={210} height={210} />
              </div>

              <Bubble className="-left-2 top-8 h-12 w-12 -rotate-6 text-2xl text-[#8C82D9]">
                가
              </Bubble>
              <Bubble className="right-0 top-2 h-11 w-11 rotate-6 text-xl text-[#FF8A80]">
                한
              </Bubble>
              <Bubble className="-right-3 bottom-16 h-12 w-12 -rotate-3 text-2xl text-[#7B73D1]">
                글
              </Bubble>
              <Sparkle
                className="absolute bottom-6 left-4 h-7 w-7 motion-safe:animate-pulse"
                color="#FFAB91"
              />
              <Sparkle
                className="absolute left-1/2 top-0 h-5 w-5"
                color="#8C82D9"
              />
            </div>
          </section>
        )}

        {/* выбор раздела */}
        <div className=" flex sm:py-8 py-4 items-center gap-3">
          <h2 className="sm:text-2xl text-xl md:text-3xl font-extrabold text-[#2E2A4F]">
            Выбери раздел
          </h2>

          <Sparkle className="h-5 w-5 shrink-0" color="#8C82D9" />

          <span
            aria-hidden="true"
            className="h-1 flex-1 rounded-full bg-[#8C82D9]/15"
          />
        </div>

        <section
          aria-label="Разделы экзамена"
          className="grid gap-6 pb-4 sm:grid-cols-3"
        >
          {sections.map((s) => (
            <Link
              key={s.href}
              href={user ? s.href : "/profile"}
              className="group flex flex-col rounded-3xl bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(140,130,217,0.22)]"
            >
              <div
                className={`relative flex h-44 items-center justify-center overflow-hidden rounded-[20px] ${s.tile} shadow-[inset_0_-6px_0_rgba(0,0,0,0.05),inset_0_4px_0_rgba(255,255,255,0.7)]`}
              >
                {/* точечный узор */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(255,255,255,0.9)_2px,transparent_2.5px)] [background-size:18px_18px]"
                />
                {/* «глиняный» диск под иллюстрацией */}
                <div
                  aria-hidden="true"
                  className="absolute h-32 w-32 rounded-full bg-white/60 shadow-[inset_0_-6px_0_rgba(0,0,0,0.05)] transition-transform duration-300 group-hover:scale-110"
                />
                {/* корейский слог в бейдже */}
                <span
                  lang="ko"
                  aria-hidden="true"
                  className="absolute left-3 top-3 flex h-10 w-10 -rotate-6 items-center justify-center rounded-xl bg-white text-xl font-extrabold shadow-[0_6px_14px_rgba(0,0,0,0.08),inset_0_-3px_0_rgba(0,0,0,0.05)]"
                  style={{ color: s.accent }}
                >
                  {s.glyph}
                </span>
                <Sparkle
                  className="absolute right-4 top-4 h-5 w-5"
                  color={s.accent}
                />
                <Sparkle
                  className="absolute bottom-4 left-5 h-3.5 w-3.5 opacity-70"
                  color={s.accent}
                />
                <div className="relative transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                  {s.art}
                </div>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <h3 className="text-2xl font-extrabold">{s.title}</h3>
                <span className="text-lg font-bold text-[#8C82D9]" lang="ko">
                  {s.ko}
                </span>
              </div>

              <p className="mt-1.5 flex-1 font-semibold leading-relaxed text-[#2E2A4F]/60">
                {s.desc}
              </p>

              {s.chips && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-[#F4F5FB] px-3 py-1 text-sm font-bold text-[#7B73D1]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF8A80] py-3 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-colors group-hover:bg-[#FF9A91]">
                Начать
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/30 transition-transform duration-300 group-hover:translate-x-1">
                  <Chevron className="h-3.5 w-3.5" />
                </span>
              </span>
            </Link>
          ))}
        </section>

        <footer className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-[#2E2A4F]/45">
          <Sparkle className="h-3.5 w-3.5" color="#FFAB91" />
          화이팅! Удачи на экзамене
          <Sparkle className="h-3.5 w-3.5" color="#8C82D9" />
        </footer>
      </div>
    </div>
  );
}
