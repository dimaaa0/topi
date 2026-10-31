"use client";

import { useState } from "react";

/* ---------- Данные ---------- */

const TASKS = {
  51: {
    text: `안녕하십니까? 어제 오후 도서관을 이용했던 학생입니다. 어제 3층 열람실에서 공부를 마치고 귀가했는데, 나중에 확인해 보니 제 지갑이 없었습니다. 아무리 찾아도 없는 것을 보니 도서관에 (  ㄱ  ). 지갑은 검은색 가죽 지갑이며 안에는 제 학생증이 들어 있습니다. 혹시 비슷한 지갑을 보셨거나 보관하고 계시다면 아래에 남긴 제 연락처로 꼭 (  ㄴ  ). 감사합니다.`,
  },
  52: {
    text: `사람들은 보통 슬프거나 아플 때만 눈물을 흘린다고 생각한다. 하지만 눈물은 우리가 모르는 사이에도 항상 분비되어 눈의 건강을 유지해 준다. 얇은 눈물층은 눈동자 표면을 촉촉하게 만들어 외부의 먼지나 세균으로부터 눈을 (  ㄱ  ). 그런데 최근 스마트폰이나 컴퓨터 화면을 장시간 들여다보는 사람들이 늘어나고 있다. 화면에 집중하다 보면 자연스럽게 눈을 깜박이는 횟수가 줄어들게 된다. 이처럼 눈을 자주 깜박이지 않으면 눈물이 쉽게 말라서 안구 건조증이 (  ㄴ  ). 따라서 눈 건강을 위해서는 의식적으로 눈을 자주 깜박여 주는 것이 좋다.`,
  },
} as const;

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

// Подсвечивает пропуски (ㄱ) и (ㄴ) в тексте задания
function TaskText({ text }: { text: string }) {
  const parts = text.split(/(\(\s*[ㄱㄴ]\s*\))/);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\(\s*([ㄱㄴ])\s*\)$/);
        if (!m) return <span key={i}>{part}</span>;
        const first = m[1] === "ㄱ";
        return (
          <span
            key={i}
            className={`mx-1 inline-flex min-w-14 items-center justify-center rounded-lg border-2 border-dashed bg-white px-2 align-middle text-base font-extrabold ${
              first
                ? "border-[#8C82D9] text-[#7B73D1]"
                : "border-[#FF8A80] text-[#E5675C]"
            }`}
          >
            {m[1]}
          </span>
        );
      })}
    </>
  );
}

const inputCls =
  "w-full rounded-2xl border-2 border-transparent bg-[#F4F5FB] px-4 py-3 font-semibold text-[#2E2A4F] placeholder:text-[#2E2A4F]/35 transition-colors focus:border-[#8C82D9] focus:bg-white focus:outline-none";

/* ---------- Страница ---------- */

export default function WritingPage() {
  const [activeTask, setActiveTask] = useState<51 | 52>(51);

  // Состояния для ответов (пока только для интерфейса)
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");

  const task = TASKS[activeTask];

  const selectTask = (n: 51 | 52) => {
    setActiveTask(n);
    setAnswer1("");
    setAnswer2("");
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-6 sm:px-8">
      {/* Шапка страницы */}
      <div className="mb-7 flex items-center gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.05),inset_0_3px_0_rgba(255,255,255,0.7)]">
          <span lang="ko" className="text-2xl font-extrabold text-[#FFAB91]">
            쓰
          </span>
        </div>
        <div>
          <h1 className="flex items-baseline gap-2 text-3xl font-extrabold leading-tight">
            Письмо
            <span lang="ko" className="text-xl text-[#8C82D9]">
              쓰기
            </span>
            <Sparkle
              className="h-4 w-4 self-center motion-safe:animate-pulse"
              color="#FF8A80"
            />
          </h1>
          <p className="mt-0.5 font-semibold text-[#2E2A4F]/60">
            TOPIK II · 51 и 52
          </p>
        </div>
      </div>

      {/* Переключатель заданий */}
      <div
        role="tablist"
        aria-label="Задание"
        className="mb-6 grid grid-cols-2 gap-1.5 rounded-3xl bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
      >
        {([51, 52] as const).map((n) => {
          const active = activeTask === n;
          return (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTask(n)}
              className={`cursor-pointer rounded-[20px] px-3 py-3 text-center transition-all ${
                active
                  ? "bg-[#8C82D9] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1),0_6px_14px_rgba(140,130,217,0.3)]"
                  : "text-[#2E2A4F]/60 hover:bg-[#F4F5FB] hover:text-[#2E2A4F]"
              }`}
            >
              <span className="block font-extrabold">Задание {n}</span>
            </button>
          );
        })}
      </div>

      {/* Основной блок задания */}
      <div className="relative overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(140,130,217,0.14)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#8C82D9]/10"
        />

        {/* Информация о задании */}
        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-[#E7E4FA] px-3.5 py-1.5 text-sm font-extrabold text-[#7B73D1]">
            10 баллов
          </span>
        </div>

        {/* Текст задачи */}
        <section className="relative mb-8">
          <h2 className="mb-2.5 flex items-center gap-2 font-extrabold">
            Текст задания
            <Sparkle className="h-3.5 w-3.5" color="#FFAB91" />
          </h2>
          <p
            lang="ko"
            className="rounded-2xl  text-lg font-semibold leading-[2.2] "
          >
            <TaskText text={task.text} />
          </p>
        </section>

        {/* Поля для ввода ответов */}
        <section className="relative mb-8">
          <h2 className="mb-3 font-extrabold">Ваши ответы</h2>

          <div className="space-y-3">
            {[
              {
                id: "answer-1",
                label: "ㄱ",
                value: answer1,
                set: setAnswer1,
                tone: "bg-[#E7E4FA] text-[#7B73D1]",
              },
              {
                id: "answer-2",
                label: "ㄴ",
                value: answer2,
                set: setAnswer2,
                tone: "bg-[#FFE0DC] text-[#E5675C]",
              },
            ].map((f) => (
              <div key={f.id} className="flex items-center gap-3">
                <label
                  htmlFor={f.id}
                  lang="ko"
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold shadow-[inset_0_-3px_0_rgba(0,0,0,0.06)] ${f.tone}`}
                >
                  {f.label}
                </label>
                <input
                  id={f.id}
                  type="text"
                  lang="ko"
                  autoComplete="off"
                  placeholder={`Введите ответ для пропуска`}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Кнопка отправки (пока без логики) */}
        <button
          type="button"
          onClick={() => alert("Логика проверки будет добавлена позже!")}
          className="relative w-full cursor-pointer rounded-2xl bg-[#FF8A80] py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#FF9A91]"
        >
          Отправить на проверку
        </button>
      </div>
    </div>
  );
}
