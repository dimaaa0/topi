import type { Reading } from "@prisma/client";

export const MIN_TASK = 1;
export const MAX_TASK = 50;

// [от, до, тип задания в БД]. Подгони под свою нарезку заданий.
export const READING_RANGES: ReadonlyArray<readonly [number, number, number]> = [
  [1, 2, 1],
  [3, 4, 2],
  [5, 8, 3],
  [9, 12, 4],
  [13, 15, 5],
  [16, 18, 6],
  [19, 20, 7],
  [21, 24, 8],
  [25, 27, 9],
  [28, 31, 10],
  [32, 34, 11],
  [35, 38, 12],
  [39, 41, 13],
  [42, 43, 14],
  [44, 45, 15],
  [46, 47, 16],
  [48, 50, 17],
];

// Сколько заданий каждого типа нужно для полного мока
export const READING_TYPES = READING_RANGES.map(([from, to, type]) => ({
  type,
  count: to - from + 1,
}));

export function getTargetQuestionType(slot: number): number {
  const r = READING_RANGES.find(([from, to]) => slot >= from && slot <= to);
  return r ? r[2] : 1;
}

export type ReadingContent = {
  question?: string;
  passage?: string | string[];
  example?: string; // блок <보기>
  options?: Array<string | number>;
  answer?: number | string;
  explanation?: string;
  translation?: string;
  question_number?: number;
};

export type TaskSnapshot = Pick<
  Reading,
  "id" | "number" | "questionNumber" | "imageUrl" | "content"
>;

export type SlotState = {
  task: TaskSnapshot;
  userAnswer: string;
  isRevealed: boolean;
};

export type SavedReadingSession = {
  version: 1;
  startRange: number;
  endRange: number;
  activeTask: number;
  answers: Record<number, SlotState>;
};

export const STORAGE_KEY = "topi_reading_session_v1";

export function getTaskType(t: TaskSnapshot): number {
  return (t.content as ReadingContent | null)?.question_number ?? t.questionNumber ?? 0;
}

export function toSnapshot(t: TaskSnapshot): TaskSnapshot {
  return {
    id: t.id,
    number: t.number,
    questionNumber: t.questionNumber,
    imageUrl: t.imageUrl,
    content: t.content,
  };
}

// Выбирает задание для слота; уже использованные в сессии не берём повторно.
export function pickTask(
  tasks: Reading[],
  slot: number,
  answers: Record<number, SlotState>
): TaskSnapshot | undefined {
  const type = getTargetQuestionType(slot);
  const matching = tasks.filter((t) => getTaskType(t) === type);
  const used = new Set(Object.values(answers).map((a) => a.task.id));
  const task = matching.find((t) => !used.has(t.id)) ?? matching[0];
  return task ? toSnapshot(task) : undefined;
}

function isValidSlot(v: unknown): v is SlotState {
  const s = v as SlotState;
  return Boolean(
    s &&
      typeof s === "object" &&
      s.task &&
      typeof s.task.id === "string" &&
      typeof s.userAnswer === "string" &&
      typeof s.isRevealed === "boolean"
  );
}

export function restoreSession(raw: string, tasks: Reading[]) {
  const saved = JSON.parse(raw);
  if (saved?.version !== 1) return null;

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
    if (slot >= start && slot <= end && isValidSlot(value)) answers[slot] = value;
  }

  const active = Math.min(Math.max(Number(saved.activeTask) || start, start), end);
  const current = answers[active];

  if (!current || (!current.isRevealed && !tasks.some((t) => t.id === current.task.id))) {
    const fresh = pickTask(tasks, active, answers);
    if (fresh) answers[active] = { task: fresh, userAnswer: "", isRevealed: false };
    else delete answers[active];
  }

  return { start, end, active, answers };
}