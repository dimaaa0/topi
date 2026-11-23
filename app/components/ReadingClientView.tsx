"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Reading } from "@prisma/client";
import { completeReadingTask } from "../actions/completeReading";
import { resetReadingProgress } from "../actions/resetReadingProgress";
import { ReadingRangePicker } from "./reading/ReadingRangePicker";
import { ReadingNavigator } from "./reading/ReadingNavigator";
import { ReadingPassage } from "./reading/ReadingPassage";
import { ReadingOptions } from "./reading/ReadingOptions";
import { ReadingExplanation } from "./reading/ReadingExplanation";

import {
  MIN_TASK,
  MAX_TASK,
  STORAGE_KEY,
  getTargetQuestionType,
  getTaskType,
  pickTask,
  restoreSession,
  type ReadingContent,
  type SavedReadingSession,
  type SlotState,
} from "@/lib/reading";

interface Props {
  initialData: Reading[];
  completedCount: number;
  totalCount: number;
}

export default function ReadingClientView({ initialData, completedCount, totalCount }: Props) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRangeSelected, setIsRangeSelected] = useState(false);
  const [startRange, setStartRange] = useState<number>(MIN_TASK);
  const [endRange, setEndRange] = useState<number>(MAX_TASK);
  const [activeTask, setActiveTask] = useState<number>(MIN_TASK);
  const [loading, setLoading] = useState(false);
  const [solvedCount, setSolvedCount] = useState(completedCount);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, SlotState>>({});
  const router = useRouter();

  const currentSlot = sessionAnswers[activeTask];
  const currentTask = currentSlot?.task;
  const userAnswer = currentSlot?.userAnswer ?? "";
  const isAnswerRevealed = currentSlot?.isRevealed ?? false;
  const targetType = getTargetQuestionType(activeTask);

  useEffect(() => {
    setSolvedCount(completedCount);
  }, [completedCount]);

  // Восстановление сессии
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const restored = restoreSession(raw, initialData);
        if (restored) {
          setStartRange(restored.start);
          setEndRange(restored.end);
          setActiveTask(restored.active);
          setSessionAnswers(restored.answers);
          setIsRangeSelected(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    } finally {
      setIsHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Сохранение сессии
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (!isRangeSelected) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const payload: SavedReadingSession = {
        version: 1,
        startRange,
        endRange,
        activeTask,
        answers: sessionAnswers,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // storage переполнен / приватный режим
    }
  }, [isHydrated, isRangeSelected, startRange, endRange, activeTask, sessionAnswers]);

  const clearSavedSession = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setSessionAnswers({});
    setIsRangeSelected(false);
    setActiveTask(MIN_TASK);
    setStartRange(MIN_TASK);
    setEndRange(MAX_TASK);
  };

  const updateSlot = (slot: number, patch: Partial<Omit<SlotState, "task">>) =>
    setSessionAnswers((prev) =>
      prev[slot] ? { ...prev, [slot]: { ...prev[slot], ...patch } } : prev
    );

  const beginSession = (start: number, end: number) => {
    const first = pickTask(initialData, start, {});
    setSessionAnswers(first ? { [start]: { task: first, userAnswer: "", isRevealed: false } } : {});
    setStartRange(start);
    setEndRange(end);
    setActiveTask(start);
    setIsRangeSelected(true);
  };

  const selectTask = (n: number) => {
    if (n === activeTask || n < startRange || n > endRange) return;
    setSessionAnswers((prev) => {
      if (prev[n]) return prev;
      const task = pickTask(initialData, n, prev);
      return task ? { ...prev, [n]: { task, userAnswer: "", isRevealed: false } } : prev;
    });
    setActiveTask(n);
  };

  const handleSelectOption = (val: string) => {
    if (!currentTask || isAnswerRevealed) return;
    updateSlot(activeTask, { userAnswer: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask || isAnswerRevealed || !userAnswer) return;

    updateSlot(activeTask, { isRevealed: true });
    setSolvedCount((prev) => Math.min(prev + 1, totalCount));

    try {
      await completeReadingTask(currentTask.number, targetType);
    } catch {
      console.error("Не удалось сохранить прогресс");
    }
  };

  const handleFinishRange = () => {
    clearSavedSession();
    router.refresh();
  };

  const handleResetProgress = async () => {
    setLoading(true);
    try {
      await resetReadingProgress();
      clearSavedSession();
      setSolvedCount(0);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  // ---- ранние выходы ----
  if (!isHydrated) {
    return <div className="mx-auto max-w-5xl px-5 py-20 text-center text-gray-400">Загрузка...</div>;
  }

  if (!isRangeSelected && initialData.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold text-[#2E2A4F]">Поздравляем! 🎉</h2>
          <p className="text-gray-600">Вы успешно решили все доступные задания по Чтению.</p>
          <div className="text-sm font-bold text-[#7B73D1]">
            Пройдено заданий: {solvedCount} из {totalCount}
          </div>
          <button
            type="button"
            onClick={handleResetProgress}
            disabled={loading}
            className="cursor-pointer rounded-lg bg-[#8C82D9] px-4 py-2 text-white transition-colors hover:bg-[#7B73D1] disabled:opacity-50"
          >
            Сбросить прогресс
          </button>
        </div>
      </div>
    );
  }

  if (!isRangeSelected) return <ReadingRangePicker onStart={beginSession} />;

  // ---- данные для рендера ----
  const content = (currentTask?.content ?? {}) as ReadingContent;
  const options = content.options ?? [1, 2, 3, 4];
  const correctNumber = Number(String(content.answer ?? "").trim());
  const correctIndex = Number.isInteger(correctNumber) ? correctNumber - 1 : -1;
  const selectedIndex = userAnswer ? Number(userAnswer) - 1 : -1;
  const isUserCorrect = selectedIndex >= 0 && selectedIndex === correctIndex;

  const slots = Array.from({ length: Math.max(0, endRange - startRange + 1) }, (_, i) => startRange + i);
  const revealedInSession = Object.values(sessionAnswers).filter((a) => a.isRevealed).length;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-6 sm:px-8">
      {/* Шапка */}
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.05),inset_0_3px_0_rgba(255,255,255,0.7)]">
            <span lang="ko" className="text-2xl font-extrabold text-[#8C82D9]">읽</span>
          </div>
          <h1 className="hidden items-baseline text-3xl font-extrabold leading-tight sm:flex">Чтение</h1>
        </div>
        <div className="text-right">
          <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Прогресс</span>
          <span className="text-sm font-extrabold text-[#7B73D1]">
            {revealedInSession} / {slots.length} решено
          </span>
        </div>
      </div>

      <ReadingNavigator
        slots={slots}
        active={activeTask}
        answers={sessionAnswers}
        hasData={(n) => initialData.some((t) => getTaskType(t) === getTargetQuestionType(n))}
        onSelect={selectTask}
      />

      <div className="relative overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(140,130,217,0.14)] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#8C82D9]/10" />

        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-[#E7E4FA] px-3.5 py-1.5 text-sm font-extrabold text-[#7B73D1]">
            Задание {activeTask}
          </span>
        </div>

        {currentTask ? (
          <>
            <ReadingPassage
              question={content.question}
              passage={content.passage}
              example={content.example}
              imageUrl={currentTask.imageUrl}
              alt={`Задание ${activeTask}`}
            />

            <form onSubmit={handleSubmit} className="relative space-y-6">
              <section className="relative mb-8">
                <ReadingOptions
                  options={options}
                  selectedIndex={selectedIndex}
                  correctIndex={correctIndex}
                  revealed={isAnswerRevealed}
                  disabled={isAnswerRevealed}
                  onSelect={handleSelectOption}
                />

                {isAnswerRevealed && (
                  <>
                    <p className={`mt-5 text-sm font-extrabold ${isUserCorrect ? "text-[#2E7D32]" : "text-[#E53935]"}`}>
                      {isUserCorrect
                        ? "Верно!"
                        : `Неверно. Правильный ответ: ${correctIndex >= 0 ? correctIndex + 1 : "не указан"}`}
                    </p>
                    <ReadingExplanation translation={content.translation} explanation={content.explanation} />
                  </>
                )}

                <button
                  type="button"
                  onClick={handleResetProgress}
                  disabled={loading}
                  className="mt-4 cursor-pointer rounded-lg bg-[#8C82D9] px-4 py-2 text-white transition-colors hover:bg-[#7B73D1] disabled:opacity-50"
                >
                  Сбросить прогресс
                </button>
              </section>

              {!isAnswerRevealed ? (
                <button
                  type="submit"
                  disabled={loading || !userAnswer}
                  className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-[#FF8A80] py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#FF9A91] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Проверить ответ
                </button>
              ) : activeTask < endRange ? (
                <button
                  type="button"
                  onClick={() => selectTask(activeTask + 1)}
                  className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-[#8C82D9] py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#7B73D1]"
                >
                  Перейти к следующему ({activeTask + 1})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishRange}
                  className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-green-500 py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-green-400"
                >
                  Завершить выбранный диапазон
                </button>
              )}
            </form>
          </>
        ) : (
          <p className="py-8 text-center font-semibold text-gray-400">
            Для этого задания пока нет данных.
          </p>
        )}
      </div>
    </div>
  );
}