"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Listening } from "@prisma/client";
import { completeTask } from "../actions/completeTask";
import { completeListeningTask } from "../actions/completeListening";
import { resetListeningProgress } from "../actions/resetListeningProgress";

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
  const used = new Set(
    Object.values(answers)
      .filter((a) => a.isRevealed)
      .map((a) => a.task.id)
  );
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
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRangeSelected, setIsRangeSelected] = useState(false);
  const [taskType, setTaskType] = useState<"full" | "range" | null>(null);
  const [startRange, setStartRange] = useState<number>(MIN_TASK);
  const [endRange, setEndRange] = useState<number>(MAX_TASK);
  const [activeTask, setActiveTask] = useState<number>(MIN_TASK);
  const [loading, setLoading] = useState(false);
  const [solvedCount, setSolvedCount] = useState(completedCount);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, SlotState>>({});

  const router = useRouter();

  // Синхронизируем счётчик с сервером, когда приходят новые props
  useEffect(() => {
    setSolvedCount(completedCount);
  }, [completedCount]);

  // 1. Восстанавливаем сессию ОДИН раз при загрузке страницы.
  // Раньше эффект зависел от initialData и перезапускался при каждом revalidate
  // после completeListeningTask — из-за этого вопрос "перескакивал" вперёд
  // с уже открытым ответом.
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

  // 2. Сохраняем сессию при любом изменении
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

  // Всё текущее состояние задания берём из sessionAnswers — никакого рассинхрона
  const currentSlot = sessionAnswers[activeTask];
  const currentTask = currentSlot?.task;
  const userAnswer = currentSlot?.userAnswer ?? "";
  const isAnswerRevealed = currentSlot?.isRevealed ?? false;
  const targetType = getTargetQuestionNumber(activeTask);

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
      await completeListeningTask(currentTask.number, targetType);
    } catch {
      console.error("Не удалось сохранить прогресс");
    }
  };

  const handleNextSet = async () => {
    // Раньше брали initialData[0], который после revalidate мог быть пустым/другим
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

  // Пока не прочитан localStorage, не рендерим стартовый экран
  if (!isHydrated) {
    return <div className="mx-auto max-w-5xl px-5 py-20 text-center text-gray-400">Загрузка...</div>;
  }

  // Экран "всё решено" — только вне активной сессии, иначе при revalidate
  // последнее задание пропадало бы с экрана сразу после проверки
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
            onClick={async () => {
              setLoading(true);
              try {
                await resetListeningProgress();
                clearSavedSession();
                setSolvedCount(0);
                router.refresh();
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Сбросить прогресс
          </button>
        </div>
      </div>
    );
  }

  // Экран выбора типа задания и диапазона
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

  const contentObj = currentTask?.content as any;
  const taskAudioUrl = currentTask?.audioUrl || null;
  const taskQuestion = contentObj?.question || "Текст задания не найден.";
  const taskImage = currentTask?.imageUrl || contentObj?.imageId || null;
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
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#42A5F5]/10" />

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

          {taskAudioUrl ? (
            <audio key={taskAudioUrl} controls className="w-full" src={taskAudioUrl}>
              Ваш браузер не поддерживает элемент <code>audio</code>.
            </audio>
          ) : (
            <p className="text-sm text-gray-400">Аудио для этого задания отсутствует</p>
          )}

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
            <div className="flex gap-3 sm:gap-5">

              <div className={isSentenceOptions ? "flex flex-col gap-3" : "grid grid-cols-4 gap-3 sm:gap-5"}>
                {taskOptions?.map((opt: string | number, idx: number) => {
                  const optionValue = String(opt);
                  const isSelected = userAnswer === optionValue;
                  const isCorrect =
                    String(taskAnswer) === optionValue || String(taskAnswer) === String(idx + 1);

                  if (isSentenceOptions) {
                    let cardStyle =
                      "border-gray-200 bg-white text-[#2E2A4F] hover:border-[#42A5F5] hover:bg-[#F8FAFC] hover:-translate-y-0.5";
                    let badgeStyle =
                      "bg-[#F4F5FB] text-[#2E2A4F] group-hover:bg-[#E3F2FD] group-hover:text-[#1E88E5]";

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
                        "border-[#42A5F5] bg-[#E3F2FD]/60 text-[#2E2A4F] shadow-[0_6px_16px_rgba(66,165,245,0.2)] -translate-y-0.5";
                      badgeStyle = "bg-[#42A5F5] text-white";
                    }

                    return (
                      <label
                        key={`${idx}-${optionValue}`}
                        className={`group relative flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-all duration-200 focus-within:ring-4 focus-within:ring-[#42A5F5]/30 ${cardStyle} ${isAnswerRevealed ? "pointer-events-none" : ""
                          }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={optionValue}
                          checked={isSelected}
                          disabled={isAnswerRevealed || !currentTask}
                          onChange={(e) => handleSelectOption(e.target.value)}
                          className="sr-only"
                        />
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors ${badgeStyle}`}
                        >
                          {idx + 1}
                        </span>
                        <span lang="ko" className="text-base font-bold leading-snug">
                          {optionValue}
                        </span>
                      </label>
                    );
                  }

                  return (
                    <label
                      key={optionValue}
                      className={`relative flex h-14 w-14 sm:h-20 sm:w-20 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200 focus-within:ring-4 focus-within:ring-[#42A5F5]/30 ${isSelected
                          ? "border-[#42A5F5] bg-[#42A5F5] text-white shadow-[0_8px_16px_rgba(66,165,245,0.4)] -translate-y-1"
                          : "border-gray-200 bg-white text-[#2E2A4F] hover:border-[#42A5F5] hover:text-[#42A5F5] hover:bg-[#F8FAFC] hover:-translate-y-1"
                        } ${isAnswerRevealed ? "pointer-events-none opacity-80" : ""}`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={optionValue}
                        checked={isSelected}
                        disabled={isAnswerRevealed || !currentTask}
                        onChange={(e) => handleSelectOption(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-2xl sm:text-3xl font-black">{optionValue}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  await resetListeningProgress();
                  clearSavedSession();
                  setSolvedCount(0);
                  router.refresh();
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Сбросить прогресс
            </button>

            {/* Блок правильного ответа и скрипта */}
            {isAnswerRevealed && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                {String(taskAnswer) === userAnswer ? (
                  <div className="w-full rounded-2xl bg-[#E8F5E9] p-5 shadow-sm border border-[#C8E6C9]">
                    <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#4CAF50]">
                      Правильный ответ
                    </div>
                    <p className="font-extrabold text-[#2E2A4F] text-lg">
                      {taskAnswer || "Ответ не указан"}
                    </p>
                  </div>
                ) : (
                  <div className="w-full rounded-2xl bg-[#FFEBEE] p-5 shadow-sm border border-[#FFCDD2]">
                    <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E53935]">
                      Неверно
                    </div>
                    <p className="font-extrabold text-[#2E2A4F] text-lg">
                      Правильный ответ: {taskAnswer || "Ответ не указан"}
                    </p>
                  </div>
                )}

                {taskScript && (
                  <div className="rounded-2xl bg-[#F4F5FB] p-4">
                    <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-[#42A5F5]">
                      Диалог:
                    </div>
                    {Array.isArray(taskScript) ? (
                      <div lang="ko" className="space-y-1.5 text-sm leading-relaxed text-[#2E2A4F]">
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