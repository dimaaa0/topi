"use client";
import { useState } from "react";
import type { Writing } from "@prisma/client";
import { completeTask } from "../actions/completeTask";

type TopikTask = {
  task_number: number;
  content: string;
  description: string;
  words: {
    gap_g: string[];
    gap_n: string[];
  };
  grammars: {
    gap_g: string[];
    gap_n: string[];
  };
};

type WritingData = Pick<Writing, "id" | "number" | "content">;

function isTopikTask(value: unknown): value is TopikTask {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  return (
    "task_number" in value &&
    "content" in value &&
    "words" in value &&
    "grammars" in value &&
    "description" in value
  );
}

interface WritingClientViewProps {
  initialWriting: WritingData | null;
  completedCount: number;
  totalCount: number;
}

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
            className={`mx-1 inline-flex min-w-14 items-center justify-center rounded-lg border-2 border-dashed bg-white px-2 align-middle text-base font-extrabold ${first ? "border-[#8C82D9] text-[#7B73D1]" : "border-[#FF8A80] text-[#E5675C]"}`}
          >
            {m[1]}
          </span>
        );
      })}
    </>
  );
}

const inputCls =
  "w-full rounded-2xl border-2 border-transparent bg-[#F4F5FB] px-4 py-3 font-semibold text-[#2E2A4F] placeholder:text-[#2E2A4F]/35 transition-colors focus:border-[#8C82D9] focus:bg-white focus:outline-none disabled:opacity-70 disabled:bg-gray-100 disabled:cursor-not-allowed";

export default function WritingClientView({
  initialWriting,
  completedCount,
  totalCount,
}: WritingClientViewProps) {
  const [activeTask, setActiveTask] = useState<51 | 52>(51);
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [loading, setLoading] = useState(false);

  // Добавляем стейт для отображения ответов
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  if (!initialWriting) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-2xl font-extrabold text-[#2E2A4F]">
            Поздравляем! 🎉
          </h2>
          <p className="text-gray-600">
            Вы успешно решили все доступные задания по Writing.
          </p>
          <div className="text-sm text-purple-600 font-bold">
            Пройдено наборов: {completedCount} из {totalCount}
          </div>
        </div>
      </div>
    );
  }

  const content = initialWriting.content;
  const taskList =
    content !== null && typeof content === "object" && !Array.isArray(content)
      ? content.topik_writing_tasks
      : null;
  const tasks = Array.isArray(taskList) ? taskList.filter(isTopikTask) : [];
  const currentTaskData = tasks.find((t) => t.task_number === activeTask);
  const taskText = currentTaskData?.content || "Текст задания не найден.";

  // При переключении табов сбрасываем всё
  const selectTask = (n: 51 | 52) => {
    setActiveTask(n);
    setAnswer1("");
    setAnswer2("");
    setIsAnswerRevealed(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnswerRevealed(true); // Раскрываем ответы

    setLoading(true);
    try {
      await completeTask(initialWriting.number, "Writing");
    } catch (err) {
      alert("Произошла ошибка при сохранении.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-6 sm:px-8">
      {/* Шапка и Прогресс */}
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.05),inset_0_3px_0_rgba(255,255,255,0.7)]">
            <span lang="ko" className="text-2xl font-extrabold text-[#FFAB91]">
              쓰
            </span>
          </div>
          <h1 className="flex items-baseline text-3xl font-extrabold leading-tight">
            Письмо
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Прогресс
          </span>
          <span className="text-sm font-extrabold text-purple-600">
            {completedCount} / {totalCount} пройдено
          </span>
        </div>
      </div>

      {/* Табы 51/52 */}
      <div
        role="tablist"
        className="mb-6 grid grid-cols-2 gap-1.5 rounded-3xl bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
      >
        {([51, 52] as const).map((n) => {
          const active = activeTask === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => selectTask(n)}
              className={`cursor-pointer rounded-[20px] px-3 py-3 text-center transition-all ${active ? "bg-[#8C82D9] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1),0_6px_14px_rgba(140,130,217,0.3)]" : "text-[#2E2A4F]/60 hover:bg-[#F4F5FB] hover:text-[#2E2A4F]"}`}
            >
              <span className="block font-extrabold">Задание {n}</span>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(140,130,217,0.14)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#8C82D9]/10"
        />

        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-[#E7E4FA] px-3.5 py-1.5 text-sm font-extrabold text-[#7B73D1]">
            10 баллов
          </span>
        </div>

        {/* Текст задания всегда остается сверху */}
        <section className="relative mb-8">
          <h2 className="mb-2.5 flex items-center gap-1 font-extrabold">
            Текст задания <Sparkle className="h-3.5 w-3.5" color="#FFAB91" />
          </h2>
          <p
            lang="ko"
            className="rounded-2xl text-lg font-semibold leading-[2.2]"
          >
            <TaskText text={taskText} />
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <section className="relative mb-8">
            <h2 className="mb-3 font-extrabold">
              Ваши ответы на {activeTask} задание
            </h2>
            <div className="space-y-5">
              {[
                {
                  id: "answer-1",
                  label: "ㄱ",
                  value: answer1,
                  set: setAnswer1,
                  tone: "bg-[#E7E4FA] text-[#7B73D1]",
                  dataWords: currentTaskData?.words.gap_g,
                  dataGrammars: currentTaskData?.grammars.gap_g,
                },
                {
                  id: "answer-2",
                  label: "ㄴ",
                  value: answer2,
                  set: setAnswer2,
                  tone: "bg-[#FFE0DC] text-[#E5675C]",
                  dataWords: currentTaskData?.words.gap_n,
                  dataGrammars: currentTaskData?.grammars.gap_n,
                },
              ].map((f) => (
                <div key={f.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
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
                      placeholder="Введите ответ для пропуска"
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      disabled={isAnswerRevealed} // Блокируем инпут после показа ответа
                      className={inputCls}
                    />
                  </div>

                  {/* Блок правильных ответов появляется прямо под инпутом с отступом (ml-[60px] выравнивает под инпут, минуя иконку) */}
                  {isAnswerRevealed && (
                    <div className="ml-[60px] rounded-2xl bg-[#F4F5FB] p-4 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-2">
                      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Возможные ответы:
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <span className="text-xs font-bold text-gray-400">
                            Слова
                          </span>
                          <p className="font-semibold text-[#2E2A4F]">
                            {f.dataWords?.join(", ")}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-400">
                            Грамматика
                          </span>
                          <p className="font-semibold text-[#2E2A4F]">
                            {f.dataGrammars?.join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Общее объяснение задания появляется внизу */}
            {isAnswerRevealed && currentTaskData?.description && (
              <div className="mt-6 rounded-2xl bg-[#FFF9EB] p-5 border border-[#FFE082] animate-in fade-in slide-in-from-top-4">
                <h4 className="mb-2 font-extrabold text-[#2E2A4F]">
                  Объяснение
                </h4>
                <p className="text-sm font-medium leading-relaxed text-gray-700">
                  {currentTaskData.description}
                </p>
              </div>
            )}
          </section>

          {/* Меняем кнопку на переход к следующему заданию после показа ответов */}
          {!isAnswerRevealed ? (
            <button
              type="submit"
              disabled={loading || !answer1 || !answer2} // Лучше блокировать, если поля пустые
              className="relative flex w-full items-center justify-center cursor-pointer rounded-2xl bg-[#FF8A80] py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#FF9A91] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex h-6 items-center gap-1.5">
                  <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-white [animation-delay:-0.2s]"></div>
                  <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-white [animation-delay:-0.1s]"></div>
                  <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-white"></div>
                </div>
              ) : (
                "Показать ответ"
              )}
            </button>
          ) : (
            activeTask === 51 && (
              <button
                type="button"
                onClick={() => selectTask(52)}
                className="relative flex w-full items-center justify-center cursor-pointer rounded-2xl bg-[#8C82D9] py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#9B93E0]"
              >
                Перейти к 52 заданию
              </button>
            )
          )}
        </form>
      </div>
    </div>
  );
}
