"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Listening } from "@prisma/client";
import { completeTask } from "../actions/completeTask";
import { resetListeningProgress } from "../actions/resetProgress";



type ListeningData = Pick<Listening, "id" | "number" | "content">;
function isTopikListeningTask(value: unknown): value is TopikListeningTask {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return (
    "task_number" in value &&
    "content" in value &&
    "options" in value &&
    "correct_answer" in value &&
    "description" in value
  );
}

interface ListeningClientViewProps {
  initialData: ListeningData | null;
  completedCount: number;
  totalCount: number;
}

function Sparkle({ className = "", color = "#42A5F5" }: { className?: string; color?: string; }) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M12 1c.8 5.6 3.4 9.2 11 11-7.6 1.8-10.2 5.4-11 11-.8-5.6-3.4-9.2-11-11C8.6 10.2 11.2 6.6 12 1z" fill={color} /></svg>;
}

const inputCls = "w-full rounded-2xl border-2 border-transparent bg-[#F4F5FB] px-4 py-3 font-semibold text-[#2E2A4F] placeholder:text-[#2E2A4F]/35 transition-colors focus:border-[#42A5F5] focus:bg-white focus:outline-none disabled:opacity-70 disabled:bg-gray-100 disabled:cursor-not-allowed";

export default function ListeningClientView({
  initialData,
  completedCount,
  totalCount,
}: ListeningClientViewProps) {
  // Стейты для выборки диапазона
  const [isRangeSelected, setIsRangeSelected] = useState(false);
  const [startRange, setStartRange] = useState<number>(1);
  const [endRange, setEndRange] = useState<number>(50);

  // Основные стейты
  const [activeTask, setActiveTask] = useState<number>(1);
  const [userAnswer, setUserAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  const router = useRouter();

  // Экран завершения всех доступных наборов
  if (!initialData) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-2xl font-extrabold text-[#2E2A4F]">Поздравляем! 🎉</h2>
          <p className="text-gray-600">Вы успешно решили все доступные задания по Аудированию.</p>
          <div className="text-sm text-blue-600 font-bold">
            Пройдено наборов: {completedCount} из {totalCount}
          </div>
          {/* <button
            onClick={async () => {
              setLoading(true);
              try {
                await resetListeningProgress();
                router.refresh();
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Сбросить прогресс
          </button> */}
        </div>
      </div>
    );
  }

  // Парсинг данных
  const content = initialData.content;
  // Поменяйте "topik_listening_tasks" на ваш ключ в JSON
  const taskList = content !== null && typeof content === "object" && !Array.isArray(content) ? (content as any).topik_listening_tasks : null;
  const tasks = Array.isArray(taskList) ? taskList.filter(isTopikListeningTask) : [];

  // Экран выбора диапазона (показывается первым)
  if (!isRangeSelected) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <div className="bg-white rounded-[28px] p-8 shadow-[0_12px_32px_rgba(66,165,245,0.14)] space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E3F2FD] text-3xl font-extrabold text-[#42A5F5] mb-4">
              <span lang="ko">듣</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#2E2A4F]">Выберите задания</h2>
            <p className="text-sm text-gray-500 font-medium">Укажите диапазон заданий, которые хотите решить сейчас.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">От задания</label>
              <input
                type="number"
                min={1}
                max={50}
                value={startRange}
                onChange={(e) => setStartRange(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">До задания</label>
              <input
                type="number"
                min={startRange}
                max={50}
                value={endRange}
                onChange={(e) => setEndRange(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (startRange <= endRange && startRange > 0) {
                setActiveTask(startRange);
                setIsRangeSelected(true);
              }
            }}
            className="w-full rounded-2xl bg-[#42A5F5] py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#2196F3]"
          >
            Начать решение
          </button>
        </div>
      </div>
    );
  }

  const currentTaskData = tasks.find((t) => t.task_number === activeTask);
  const taskText = currentTaskData?.content || "Текст или аудио задания не найдены.";

  const selectTask = (n: number) => {
    setActiveTask(n);
    setUserAnswer("");
    setIsAnswerRevealed(false);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnswerRevealed(true);
  };

  const handleNextSet = async () => {
    setLoading(true);
    try {
      await completeTask(initialData.number, "Listening");
      setIsRangeSelected(false);
      setUserAnswer("");
      setIsAnswerRevealed(false);
      setStartRange(1);
      setEndRange(50);
      router.refresh();
    } catch {
      alert("Произошла ошибка при сохранении. Пожалуйста, попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  // Генерируем массив номеров для навигации
  const rangeArray = Array.from({ length: endRange - startRange + 1 }, (_, i) => startRange + i);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-6 sm:px-8">
      {/* Шапка и Прогресс */}
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.05),inset_0_3px_0_rgba(255,255,255,0.7)]">
            <span lang="ko" className="text-2xl font-extrabold text-[#42A5F5]">듣</span>
          </div>
          <h1 className="flex items-baseline text-3xl font-extrabold leading-tight">Аудирование</h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Прогресс</span>
          <span className="text-sm font-extrabold text-[#42A5F5]">{completedCount} / {totalCount} пройдено</span>
        </div>
      </div>

      {/* Навигация по выбранному диапазону (Scrollable tabs) */}
      <div className="mb-6 flex gap-2 overflow-x-auto rounded-3xl bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.05)] custom-scrollbar">
        {rangeArray.map((n) => {
          const active = activeTask === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => selectTask(n)}
              className={`min-w-[48px] shrink-0 cursor-pointer rounded-[20px] px-3 py-2.5 text-center transition-all ${active
                ? "bg-[#42A5F5] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1),0_6px_14px_rgba(66,165,245,0.3)]"
                : "text-[#2E2A4F]/60 hover:bg-[#E3F2FD] hover:text-[#2E2A4F]"
                }`}
            >
              <span className="block font-extrabold">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(66,165,245,0.14)] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#42A5F5]/10" />

        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-[#E3F2FD] px-3.5 py-1.5 text-sm font-extrabold text-[#1E88E5]">
            Задание {activeTask}
          </span>
        </div>

        {/* Контент задания */}
        <section className="relative mb-8">
          <h2 className="mb-2.5 flex items-center gap-1 font-extrabold">
            Материал задания <Sparkle className="h-3.5 w-3.5" color="#FFAB91" />
          </h2>
          <div className="rounded-2xl bg-[#F4F5FB] p-5 text-lg font-semibold leading-[2.2] text-[#2E2A4F]">
            {/* Здесь можно разместить плеер, если content - это ссылка на аудио, или просто текст транскрипта */}
            {taskText}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <section className="relative mb-8">
            <h2 className="mb-3 font-extrabold">Ваш ответ</h2>

            {/* Варианты ответов или инпут */}
            <div className="space-y-3">
              {currentTaskData?.options && currentTaskData.options.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {currentTaskData.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-all ${userAnswer === opt
                        ? "border-[#42A5F5] bg-[#E3F2FD]"
                        : "border-transparent bg-[#F4F5FB] hover:border-[#42A5F5]/50"
                        } ${isAnswerRevealed ? "pointer-events-none opacity-80" : ""}`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={opt}
                        checked={userAnswer === opt}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="hidden"
                      />
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#42A5F5] shadow-sm">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-[#2E2A4F]">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Введите ваш ответ"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={isAnswerRevealed}
                  className={inputCls}
                />
              )}
            </div>

            {/* Блок правильного ответа и объяснения */}
            {isAnswerRevealed && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="w-full rounded-2xl bg-[#E8F5E9] p-5 shadow-sm border border-[#C8E6C9]">
                  <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#4CAF50]">
                    Правильный ответ
                  </div>
                  <p className="font-extrabold text-[#2E2A4F] text-lg">
                    {currentTaskData?.correct_answer || "Ответ не указан"}
                  </p>
                </div>

                {currentTaskData?.description && (
                  <div className="rounded-2xl bg-[#FFF9EB] p-5 border border-[#FFE082]">
                    <h4 className="mb-2 font-extrabold text-[#2E2A4F]">Разбор задания</h4>
                    <p className="text-sm font-medium leading-relaxed text-gray-700">
                      {currentTaskData.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Кнопки управления */}
          {!isAnswerRevealed ? (
            <button
              type="submit"
              disabled={loading || !userAnswer}
              className="relative flex w-full items-center justify-center cursor-pointer rounded-2xl bg-[#FF8A80] py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#FF9A91] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Проверить ответ
            </button>
          ) : activeTask < endRange ? (
            <button
              type="button"
              onClick={() => selectTask(activeTask + 1)}
              className="relative flex w-full items-center justify-center cursor-pointer rounded-2xl bg-[#42A5F5] py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#2196F3]"
            >
              Перейти к следующему ({activeTask + 1})
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextSet}
              disabled={loading}
              className="relative flex w-full items-center justify-center cursor-pointer rounded-2xl bg-green-500 py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-green-400 disabled:opacity-50"
            >
              {loading ? "Сохранение..." : "Завершить выбранный диапазон"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}