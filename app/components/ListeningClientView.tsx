"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Listening } from "@prisma/client";
import { completeTask } from "../actions/completeTask";
import { completeListeningTask } from "../actions/completeListening";
import { resetListeningProgress } from "../actions/resetListeningProgress";
import { TaskAudioPlayer } from "./TaskAudioPlayer";

interface ListeningClientViewProps {
  initialData: Listening[];
  completedCount: number;
  totalCount: number;
}

// Храним снимок задания прямо в сессии: после проверки ответа задание помечается
// выполненным в БД и пропадает из initialData, но на экране оно должно остаться.
type TaskSnapshot = Pick<
  Listening,
  "id" | "number" | "questionNumber" | "audioUrl" | "imageUrl" | "content"
>;

// Единственный источник правды по слоту (номеру задания в тесте 1..50)
type SlotState = {
  task: TaskSnapshot;
  userAnswer: string;
  isRevealed: boolean;
};

type SavedListeningSession = {
  version: 2;
  startRange: number;
  endRange: number;
  activeTask: number;
  answers: Record<number, SlotState>;
};

const STORAGE_KEY = "topi_listening_session_v2";
const LEGACY_STORAGE_KEY = "topi_listening_session_v1";
const MIN_TASK = 1;
const MAX_TASK = 50;

const inputCls =
  "w-full rounded-2xl border-2 border-transparent bg-[#F4F5FB] px-4 py-3 font-semibold text-[#2E2A4F] placeholder:text-[#2E2A4F]/35 transition-colors focus:border-[#42A5F5] focus:bg-white focus:outline-none disabled:opacity-70 disabled:bg-gray-100 disabled:cursor-not-allowed";

// Переводит номер задания в тесте (1..50) в тип задания из БД (content.question_number)
function getTargetQuestionNumber(examTask: number): number {
  if (examTask === 1 || examTask === 2) return 1; // 1 и 2 задания — одинаковый формат (тип 1)
  if (examTask === 3) return 2; // 3 задание — формат типа 2
  if (examTask === 4 || examTask === 5 || examTask === 6 || examTask === 7 || examTask === 8) return 3;
  if (examTask === 9 || examTask === 10 || examTask === 11 || examTask === 12) return 4;
  if (examTask === 13 || examTask === 14 || examTask === 15 || examTask === 16) return 5;
  if (examTask === 17 || examTask === 18 || examTask === 19 || examTask === 20) return 6;
  return examTask - 1; // 4 -> 3, 5 -> 4 и т.д.
}

function getTaskType(t: TaskSnapshot): number {
  return (t.content as any)?.question_number ?? t.questionNumber;
}

function toSnapshot(t: TaskSnapshot): TaskSnapshot {
  return {
    id: t.id,
    number: t.number,
    questionNumber: t.questionNumber,
    audioUrl: t.audioUrl,
    imageUrl: t.imageUrl,
    content: t.content,
  };
}

// Выбирает задание для слота. Уже проверенные в этой сессии задания не берём повторно.
function pickTask(
  tasks: Listening[],
  slot: number,
  answers: Record<number, SlotState>
): TaskSnapshot | undefined {
  const type = getTargetQuestionNumber(slot);
  const matching = tasks.filter((t) => getTaskType(t) === type);
  const used = new Set(Object.values(answers).map((a) => a.task.id));
  const task = matching.find((t) => !used.has(t.id)) ?? matching[0];
  return task ? toSnapshot(task) : undefined;
}

function isValidSlot(v: any): v is SlotState {
  return (
    v &&
    typeof v === "object" &&
    v.task &&
    typeof v.task.id === "string" &&
    typeof v.userAnswer === "string" &&
    typeof v.isRevealed === "boolean"
  );
}

// Читает и валидирует сохранённую сессию. Любой мусор -> null.
function restoreSession(raw: string, tasks: Listening[]) {
  const saved = JSON.parse(raw);
  if (saved?.version !== 2) return null;

  const start = Number(saved.startRange);
  const end = Number(saved.endRange);
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < MIN_TASK ||
    end > MAX_TASK ||
    start > end
  ) {
    return null;
  }

  const answers: Record<number, SlotState> = {};
  for (const [key, value] of Object.entries(saved.answers ?? {})) {
    const slot = Number(key);
    if (slot >= start && slot <= end && isValidSlot(value)) {
      answers[slot] = value;
    }
  }

  const active = Math.min(Math.max(Number(saved.activeTask) || start, start), end);
  const current = answers[active];

  // Нет записи по текущему слоту, либо непроверенное задание исчезло из БД
  // (например, завершено в другой вкладке) — подбираем актуальное.
  if (!current || (!current.isRevealed && !tasks.some((t) => t.id === current.task.id))) {
    const fresh = pickTask(tasks, active, answers);
    if (fresh) answers[active] = { task: fresh, userAnswer: "", isRevealed: false };
    else delete answers[active];
  }

  return { start, end, active, answers };
}

export default function ListeningClientView({
  initialData,
  completedCount,
  totalCount,
}: ListeningClientViewProps) {
  // 1. Все хуки состояния, рефы и роутер — строго в самом верху
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRangeSelected, setIsRangeSelected] = useState(false);
  const [taskType, setTaskType] = useState<"full" | "range" | null>(null);
  const [startRange, setStartRange] = useState<number>(MIN_TASK);
  const [endRange, setEndRange] = useState<number>(MAX_TASK);
  const [activeTask, setActiveTask] = useState<number>(MIN_TASK);
  const [loading, setLoading] = useState(false);
  const [solvedCount, setSolvedCount] = useState(completedCount);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, SlotState>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  // 2. Базовые вычисляемые значения, нужные в эффектах и обработчиках
  const currentSlot = sessionAnswers[activeTask];
  const currentTask = currentSlot?.task;
  const userAnswer = currentSlot?.userAnswer ?? "";
  const isAnswerRevealed = currentSlot?.isRevealed ?? false;
  const targetType = getTargetQuestionNumber(activeTask);
  const taskAudioUrl = currentTask?.audioUrl || undefined;

  // 1. Вверху файла или перед компонентом задаём базовый множитель
  const BASE_AUDIO_RATE = 0.75;

  // 2. В состоянии храним отображаемые проценты (100% по умолчанию)
  const [speedPercent, setSpeedPercent] = useState<number>(100);

  // 3. В useEffect пересчитываем проценты в реальный playbackRate (100% -> 0.9)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = BASE_AUDIO_RATE * (speedPercent / 100);
    audio.preservesPitch = true;
  }, [speedPercent, taskAudioUrl]);

  // 3. Все useEffect — строго до любых условных return
  useEffect(() => {
    setSolvedCount(completedCount);
  }, [completedCount]);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
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
      } catch { }
    } finally {
      setIsHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      if (!isRangeSelected) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const payload: SavedListeningSession = {
        version: 2,
        startRange,
        endRange,
        activeTask,
        answers: sessionAnswers,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Переполнение storage или приватный режим — молча игнорируем
    }
  }, [isHydrated, isRangeSelected, startRange, endRange, activeTask, sessionAnswers]);

  const clearSavedSession = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { }
    setSessionAnswers({});
    setIsRangeSelected(false);
    setActiveTask(MIN_TASK);
  };

  const updateSlot = (slot: number, patch: Partial<Omit<SlotState, "task">>) => {
    setSessionAnswers((prev) =>
      prev[slot] ? { ...prev, [slot]: { ...prev[slot], ...patch } } : prev
    );
  };

  const beginSession = (start: number, end: number) => {
    const first = pickTask(initialData, start, {});
    setSessionAnswers(
      first ? { [start]: { task: first, userAnswer: "", isRevealed: false } } : {}
    );
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
      await completeListeningTask(currentTask.number, targetType, userAnswer);
    } catch {
      console.error("Не удалось сохранить прогресс");
    }
  };

  const handleNextSet = async () => {
    const setNumber = currentTask?.number ?? initialData[0]?.number;
    if (setNumber == null) return;

    setLoading(true);
    try {
      await completeTask(setNumber, "Listening");
      clearSavedSession();
      setStartRange(MIN_TASK);
      setEndRange(MAX_TASK);
      router.refresh();
    } catch {
      alert("Произошла ошибка при сохранении. Пожалуйста, попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetProgress = async () => {
    setLoading(true);
    try {
      await resetListeningProgress();
      clearSavedSession();
      setSolvedCount(0);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  // 5. Ранние выходы (только после всех хуков)
  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-20 text-center text-gray-400">
        Загрузка...
      </div>
    );
  }

  if (!isRangeSelected && (!initialData || initialData.length === 0)) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-2xl font-extrabold text-[#2E2A4F]">Поздравляем! 🎉</h2>
          <p className="text-gray-600">Вы успешно решили все доступные задания по Аудированию.</p>
          <div className="text-sm text-blue-600 font-bold">
            Пройдено заданий: {solvedCount} из {totalCount}
          </div>
          <button
            type="button"
            onClick={handleResetProgress}
            disabled={loading}
            className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Сбросить прогресс
          </button>
        </div>
      </div>
    );
  }

  if (!isRangeSelected) {
    const isRangeValid =
      Number.isInteger(startRange) &&
      Number.isInteger(endRange) &&
      startRange >= MIN_TASK &&
      endRange <= MAX_TASK &&
      startRange <= endRange;

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
              type="button"
              onClick={() => setTaskType("full")}
              className={`w-full rounded-2xl py-3.5 font-extrabold transition-all ${taskType === "full"
                ? "bg-[#42A5F5] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)]"
                : "bg-gray-200 text-gray-500 cursor-pointer hover:bg-gray-300"
                }`}
            >
              Полный мок
            </button>
            <button
              type="button"
              onClick={() => setTaskType("range")}
              className={`w-full rounded-2xl py-3.5 font-extrabold transition-all ${taskType === "range"
                ? "bg-[#42A5F5] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)]"
                : "bg-gray-200 text-gray-500 cursor-pointer hover:bg-gray-300"
                }`}
            >
              Указать диапазон
            </button>
          </div>

          {taskType === "range" && (
            <div className="text-center space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    От задания
                  </label>
                  <input
                    type="number"
                    min={MIN_TASK}
                    max={MAX_TASK}
                    value={startRange}
                    onChange={(e) => setStartRange(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    До задания
                  </label>
                  <input
                    type="number"
                    min={startRange}
                    max={MAX_TASK}
                    value={endRange}
                    onChange={(e) => setEndRange(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>

              {!isRangeValid && (
                <p className="text-xs font-bold text-[#E53935]">
                  Укажите целые числа от {MIN_TASK} до {MAX_TASK}, где «от» не больше «до»
                </p>
              )}

              <button
                type="button"
                disabled={!isRangeValid}
                onClick={() => {
                  if (isRangeValid) beginSession(startRange, endRange);
                }}
                className="w-full cursor-pointer rounded-2xl bg-[#42A5F5] py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#2196F3] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                Начать решение
              </button>
            </div>
          )}

          {taskType === "full" && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-500 font-medium">
                Вам предстоит решить полный вариант аудирования TOPIK 2
              </p>
              <button
                type="button"
                onClick={() => beginSession(MIN_TASK, MAX_TASK)}
                className="w-full cursor-pointer rounded-2xl bg-green-500 py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-green-400"
              >
                Начать тест из 50 вопросов
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 6. Подготовка данных для основного рендера


  const taskImage = currentTask?.imageUrl || null;

  const contentObj = currentTask?.content as any;
  const taskQuestion = contentObj?.question || "Текст задания не найден.";
  const taskScript = contentObj?.script || null;
  const taskOptions = contentObj?.options || [1, 2, 3, 4];
  const taskAnswer = contentObj?.answer ?? null;

  const isSentenceOptions = taskOptions?.some(
    (opt: unknown) => !["1", "2", "3", "4"].includes(String(opt).trim())
  );

  const rangeArray = Array.from(
    { length: Math.max(0, endRange - startRange + 1) },
    (_, i) => startRange + i
  );
  const revealedInSession = Object.values(sessionAnswers).filter((a) => a.isRevealed).length;

  const normalizedTaskAnswer = String(taskAnswer ?? "").trim();
  const numericUserAnswer = Number(userAnswer);
  const selectedOptionIndex =
    Number.isInteger(numericUserAnswer) &&
      numericUserAnswer >= 1 &&
      numericUserAnswer <= taskOptions.length
      ? numericUserAnswer - 1
      : taskOptions.findIndex(
        (option: string | number) => String(option).trim() === userAnswer.trim()
      );
  const selectedOptionText = String(taskOptions[selectedOptionIndex] ?? "").trim();
  const correctOptionIndex = Number(normalizedTaskAnswer) - 1;

  const isUserCorrect =
    Boolean(userAnswer) &&
    selectedOptionIndex >= 0 &&
    (correctOptionIndex === selectedOptionIndex ||
      normalizedTaskAnswer === selectedOptionText);

  const displayCorrectAnswer =
    isSentenceOptions && taskOptions[correctOptionIndex] != null
      ? `${normalizedTaskAnswer}. ${taskOptions[correctOptionIndex]}`
      : normalizedTaskAnswer || "Ответ не указан";

  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-6 sm:px-8">
      {/* Шапка и Прогресс */}
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.05),inset_0_3px_0_rgba(255,255,255,0.7)]">
            <span lang="ko" className="text-2xl font-extrabold text-[#42A5F5]">
              듣
            </span>
          </div>

          <h1 className="flex sm:display hidden items-baseline text-3xl font-extrabold leading-tight">
            Аудирование
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Прогресс
          </span>
          <span className="text-sm font-extrabold text-[#42A5F5]">
            {revealedInSession} / {rangeArray.length} решено
          </span>
        </div>
      </div>

      {/* Навигация по выбранному диапазону */}
      <div className="mb-6 flex gap-2 overflow-x-auto rounded-3xl bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.05)] custom-scrollbar">
        {rangeArray.map((n) => {
          const active = activeTask === n;
          const slot = sessionAnswers[n];
          const isSolved = slot?.isRevealed;
          const tabTargetType = getTargetQuestionNumber(n);
          const hasData =
            Boolean(slot) || initialData.some((t) => getTaskType(t) === tabTargetType);

          return (
            <button
              key={n}
              type="button"
              onClick={() => selectTask(n)}
              className={`min-w-[48px] shrink-0 cursor-pointer rounded-[20px] px-3 py-2.5 text-center transition-all ${active
                ? "bg-[#42A5F5] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1),0_6px_14px_rgba(66,165,245,0.3)]"
                : isSolved
                  ? "bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]"
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#42A5F5]/10"
        />

        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-[#E3F2FD] px-3.5 py-1.5 text-sm font-extrabold text-[#1E88E5]">
            Задание {activeTask}
          </span>
        </div>

        {/* Контент задания */}
        <section className="relative mb-6 w-full space-y-4">
          <p lang="ko" className="text-lg font-bold text-[#2E2A4F]">
            {taskQuestion}
          </p>

          <TaskAudioPlayer
            key={taskAudioUrl ?? "no-audio"}
            audioRef={audioRef}
            src={taskAudioUrl}
            speedPercent={speedPercent}
            onSpeedChange={setSpeedPercent}
          />

          {taskImage && (
            <Image
              className="mt-2 rounded-2xl sm:w-[80%]"
              src={taskImage}
              alt={`Задание ${activeTask}`}
              width={600}
              height={400}
            />
          )}
        </section>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <section className="relative mb-8">
  <div
    className={
      isSentenceOptions
        ? "flex w-full flex-col gap-3"
        : "grid w-full grid-cols-4 gap-2.5 sm:gap-5"
    }
  >
    {taskOptions?.map((opt: string | number, idx: number) => {
      const optionNumber = String(idx + 1);
      const optionText = String(opt);
      const isSelected = selectedOptionIndex === idx;
      const isCorrect =
        String(taskAnswer).trim() === optionNumber ||
        String(taskAnswer).trim() === optionText.trim();

      /* ---------- Sentence options ---------- */
      if (isSentenceOptions) {
        let cardStyle =
          "border-gray-200 bg-white text-[#2E2A4F] sm:hover:border-[#42A5F5] sm:hover:bg-[#F8FAFC] sm:hover:-translate-y-0.5";
        let badgeStyle = "bg-[#F4F5FB] text-[#2E2A4F]";

        if (isAnswerRevealed) {
          if (isCorrect) {
            cardStyle = "border-[#4CAF50] bg-[#E8F5E9] text-[#2E2A4F]";
            badgeStyle = "bg-[#4CAF50] text-white";
          } else if (isSelected) {
            cardStyle = "border-[#E53935] bg-[#FFEBEE] text-[#2E2A4F]";
            badgeStyle = "bg-[#E53935] text-white";
          } else {
            cardStyle = "border-gray-200 bg-white text-[#2E2A4F] opacity-60";
          }
        } else if (isSelected) {
          cardStyle =
            "border-[#42A5F5] bg-[#E3F2FD]/60 text-[#2E2A4F] shadow-[inset_0_-4px_0_rgba(66,165,245,0.18),0_6px_16px_rgba(66,165,245,0.2)]";
          badgeStyle = "bg-[#42A5F5] text-white";
        }

        return (
          <label
            key={`${idx}-${optionNumber}`}
            className={`group relative flex min-h-[60px] w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left shadow-[inset_0_-4px_0_rgba(0,0,0,0.04)] transition-all duration-200 active:scale-[0.98] focus-within:ring-4 focus-within:ring-[#42A5F5]/30 sm:gap-3.5 sm:p-4 ${cardStyle} ${
              isAnswerRevealed ? "pointer-events-none" : ""
            }`}
          >
            <input
              type="radio"
              name="answer"
              value={optionNumber}
              checked={isSelected}
              disabled={isAnswerRevealed || !currentTask}
              onChange={(e) => handleSelectOption(e.target.value)}
              className="sr-only"
            />
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-colors ${badgeStyle}`}
            >
              {optionNumber}
            </span>
            <span lang="ko" className="min-w-0 break-words text-base font-bold leading-snug">
              {optionText}
            </span>
          </label>
        );
      }

      /* ---------- Numeric options (1–4) ---------- */
      let stateClasses =
        "border-gray-200 bg-white text-[#2E2A4F] sm:hover:border-[#42A5F5] sm:hover:text-[#42A5F5] sm:hover:bg-[#F8FAFC] sm:hover:-translate-y-1";

      if (isAnswerRevealed) {
        if (isCorrect) {
          stateClasses =
            "border-emerald-500 bg-emerald-500 text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.12),0_8px_16px_rgba(16,185,129,0.35)]";
        } else if (isSelected) {
          stateClasses =
            "border-rose-500 bg-rose-500 text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.12),0_8px_16px_rgba(244,63,94,0.35)]";
        } else {
          stateClasses = "border-gray-200 bg-white text-[#2E2A4F] opacity-50";
        }
      } else if (isSelected) {
        stateClasses =
          "border-[#42A5F5] bg-[#42A5F5] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.12),0_8px_16px_rgba(66,165,245,0.35)]";
      }

      return (
        <label
          key={optionNumber}
          className={`relative flex h-16 w-full cursor-pointer items-center justify-center rounded-2xl border-2 shadow-[inset_0_-4px_0_rgba(0,0,0,0.04)] transition-all duration-200 active:scale-95 focus-within:ring-4 focus-within:ring-[#42A5F5]/30 sm:h-20 ${stateClasses} ${
            isAnswerRevealed ? "pointer-events-none" : ""
          }`}
        >
          <input
            type="radio"
            name="answer"
            value={optionNumber}
            checked={isSelected}
            disabled={isAnswerRevealed || !currentTask}
            onChange={(e) => handleSelectOption(e.target.value)}
            className="sr-only"
          />
          <span className="text-2xl font-black sm:text-3xl">{optionText}</span>
        </label>
      );
    })}
  </div>

            <button
              type="button"
              onClick={handleResetProgress}
              disabled={loading}
              className="mt-4 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Сбросить прогресс
            </button>

            {/* Блок правильного ответа и скрипта */}
            {isAnswerRevealed && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">

                {taskScript && (
                  <div className="rounded-2xl bg-[#F4F5FB] p-4">
                    <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-[#42A5F5]">
                      Диалог:
                    </div>
                    {Array.isArray(taskScript) ? (
                      <div
                        lang="ko"
                        className="space-y-1.5 text-sm leading-relaxed text-[#2E2A4F]"
                      >
                        {taskScript.map((line: string, idx: number) => (
                          <p key={idx}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      <p lang="ko" className="text-sm text-[#2E2A4F]">
                        {taskScript}
                      </p>
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
              disabled={loading || !userAnswer || !currentTask}
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