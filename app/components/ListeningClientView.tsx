"use client"
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Listening } from "@prisma/client";
import { completeTask } from "../actions/completeTask";
import { completeListeningTask } from "../actions/completeListening"
import { resetListeningProgress } from "../actions/resetListeningProgress";

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
  initialData: Listening[]; // Теперь это массив всех заданий варианта
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

  const [taskType, setTaskType] = useState<"full" | "range" | null>(null);

  const [solvedCount, setSolvedCount] = useState(completedCount);

  const router = useRouter();

  if (!initialData || initialData.length === 0) {
    return (
      <>
        <div>Все закончилось!</div>
        <button
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
        </button>
      </>
    );
  }


  // Переводит номер задания в тесте (1..50) в тип задания из БД (content.question_number)
  function getTargetQuestionNumber(examTask: number): number {
    if (examTask === 1 || examTask === 2) return 1; // 1 и 2 задания — одинаковый формат (тип 1)
    if (examTask === 3) return 2;                    // 3 задание — формат типа 2

    // Сюда можно добавить остальные диапазоны по мере наполнения БД, например:
    // if (examTask >= 4 && examTask <= 8) return 3;

    return examTask - 1; // 4 -> 3, 5 -> 4 и т.д.
  }

  const targetType = getTargetQuestionNumber(activeTask);

  // Находим все задания нужного типа
  const matchingTasks = initialData.filter(
    (t) => ((t.content as any)?.question_number ?? t.questionNumber) === targetType
  );

  // Если в БД загружено несколько заданий типа 1, 1-й вкладке отдаем первое, 2-й — второе.
  // Если в БД пока только одно задание типа 1, сработает fallback (matchingTasks[0]) и покажет его же.
  const taskIndexInType = activeTask === 2 ? 1 : 0;
  const currentTaskData = initialData.find(
    (t) =>
      t.questionNumber === activeTask ||
      (t.content as any)?.question_number === activeTask
  );

  // Экран выбора диапазона (показывается первым)
  if (!isRangeSelected) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <div className="bg-white rounded-[28px] p-8 shadow-[0_12px_32px_rgba(66,165,245,0.14)] space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E3F2FD] text-3xl font-extrabold text-[#42A5F5] mb-4">
              <span lang="ko">듣</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#2E2A4F]">Выберите тип задания</h2>
          </div>
          <div className="flex justify-center gap-6">
            <button
              onClick={() => {
                setTaskType("full");
              }}
              className={`w-full rounded-2xl py-3.5 font-extrabold transition-all ${taskType === "range" || taskType === null
                ? "bg-gray-200 text-gray-500 cursor-default shadow-none" // Блеклый серый, если уже выбран
                : "bg-[#42A5F5] text-white cursor-pointer shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:bg-[#2196F3]" // Оригинальный синий
                }`}>
              Полный мок
            </button>
            <button
              onClick={() => {
                setTaskType("range");
              }}
              className={`w-full rounded-2xl py-3.5 font-extrabold transition-all ${taskType === "full" || taskType === null
                ? "bg-gray-200 text-gray-500 cursor-default shadow-none" // Блеклый серый, если уже выбран
                : "bg-[#42A5F5] text-white cursor-pointer shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:bg-[#2196F3]" // Оригинальный синий
                }`}>
              Указать диапазон
            </button>
          </div>
          {taskType === "range" && (
            <div className="text-center space-y-4">
              <div className="text-center space-y-2">
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
          )}
          {taskType === "full" && (
            <div className="text-center space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500 font-medium">
                  Вам предстоит решить полный вариант аудирования TOPIK 2
                </p>
              </div>

              <button
                onClick={() => {
                  setStartRange(1);
                  setEndRange(50);
                  setActiveTask(1);
                  setIsRangeSelected(true);
                }}
                className="w-full rounded-2xl bg-green-500 py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-green-400"
              >
                Начать тест из 50 вопросов
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }


  const contentObj = currentTaskData?.content as any;

  const taskAudioUrl = currentTaskData?.audioUrl || null;
  const taskQuestion = contentObj?.question || "Текст задания не найден.";
  const taskImage = currentTaskData?.imageUrl || contentObj?.imageId || null;
  const taskScript = contentObj?.script || null;
  const taskAnswer = contentObj?.answer ?? null; // Было contentObj?.question_number

  const selectTask = (n: number) => {
    setActiveTask(n);
    setUserAnswer("");
    setIsAnswerRevealed(false);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTaskData || isAnswerRevealed) return;

    setIsAnswerRevealed(true);
    setSolvedCount((prev) => Math.min(prev + 1, totalCount));

    try {
      await completeListeningTask(currentTaskData.number, targetType);
    } catch {
      console.error("Не удалось сохранить прогресс");
    }
  };

  const handleNextSet = async () => {
    setLoading(true);
    try {
      await completeTask(initialData[0].number, "Listening"); // Было initialData.number
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
          <span className="text-sm font-extrabold text-[#42A5F5]">{solvedCount} / {totalCount} пройдено</span>
        </div>
      </div>

      {/* Навигация по выбранному диапазону (Scrollable tabs) */}
      <div className="mb-6 flex gap-2 overflow-x-auto rounded-3xl bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.05)] custom-scrollbar">
        {rangeArray.map((n) => {
          const active = activeTask === n;
          const tabTargetType = getTargetQuestionNumber(n);
          const hasData = initialData.some(
            (t) => ((t.content as any)?.question_number ?? t.questionNumber) === tabTargetType
          );

          return (
            <button
              key={n}
              type="button"
              onClick={() => selectTask(n)}
              className={`min-w-[48px] shrink-0 cursor-pointer rounded-[20px] px-3 py-2.5 text-center transition-all ${active
                ? "bg-[#42A5F5] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1),0_6px_14px_rgba(66,165,245,0.3)]"
                : hasData
                  ? "text-[#2E2A4F] hover:bg-[#E3F2FD]"
                  : "text-gray-300"
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
        <section className="relative mb-4 justify-center items-center w-full">
          <p>
            {/* Здесь можно разместить плеер, если content - это ссылка на аудио, или просто текст транскрипта */}
            {taskQuestion}
          </p>
          {taskAudioUrl ? (
            <audio controls className="mt-4 w-full" src={taskAudioUrl}>
              Ваш браузер не поддерживает элемент <code>audio</code>.
            </audio>
          ) : (
            "Тут ничего нет"
          )}
          {taskImage && (
            <Image className="mt-2 sm:w-[80%]" src={taskImage} alt="Задание" width={400} height={300} />
          )}
        </section>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <section className="relative mb-8">

            {/* Варианты ответов или инпут */}
            <div className="grid grid-cols-4 gap-3 sm:gap-5">
              {[1, 2, 3, 4].map((num) => {
                // Преобразуем число в строку, так как userAnswer у вас строковый
                const isSelected = userAnswer === String(num);

                return (
                  <label
                    key={num}
                    className={`relative flex h-14 w-14 sm:h-20 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200 ${isSelected
                      ? "border-[#42A5F5] bg-[#42A5F5] text-white shadow-[0_8px_16px_rgba(66,165,245,0.4)] -translate-y-1"
                      : "border-gray-200 bg-white text-[#2E2A4F] hover:border-[#42A5F5] hover:text-[#42A5F5] hover:bg-[#F8FAFC] hover:-translate-y-1"
                      } ${isAnswerRevealed ? "pointer-events-none opacity-80" : ""}`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={String(num)}
                      checked={isSelected}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="hidden"
                    />
                    <span className="text-2xl sm:text-3xl font-black">{num}</span>
                  </label>
                );
              })}
            </div>

            {/* Блок правильного ответа и объяснения */}
            {isAnswerRevealed && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                {
                  taskAnswer == userAnswer ? (
                    <div className="w-full rounded-2xl bg-[#E8F5E9] p-5 shadow-sm border border-[#C8E6C9]">
                      <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#4CAF50]">
                        Правильный ответ
                      </div>
                      <p className="font-extrabold text-[#2E2A4F] text-lg">
                        {taskAnswer || "Ответ не указан"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p>Правильный ответ был {taskAnswer}</p>
                    </div>
                  )

                }

                {taskScript && (
                  <div className="rounded-2xl bg-[#F4F5FB] p-4">
                    <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-[#42A5F5]">
                      Скрипт задания
                    </div>
                    {Array.isArray(taskScript) ? (
                      <div className="space-y-1.5 text-sm leading-relaxed text-[#2E2A4F]">
                        {taskScript.map((line: string, idx: number) => (
                          <p key={idx}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#2E2A4F]">{taskScript}</p>
                    )}
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