"use client";

import { useState } from "react";
import { MIN_TASK, MAX_TASK } from "@/lib/reading";

const inputCls =
  "w-full rounded-2xl border-2 border-transparent bg-[#F4F5FB] px-4 py-3 font-semibold text-[#2E2A4F] transition-colors focus:border-[#8C82D9] focus:bg-white focus:outline-none";

const modeCls = (active: boolean) =>
  `w-full rounded-2xl py-3.5 font-extrabold transition-all ${
    active
      ? "bg-[#8C82D9] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)]"
      : "cursor-pointer bg-gray-200 text-gray-500 hover:bg-gray-300"
  }`;

export function ReadingRangePicker({
  onStart,
}: {
  onStart: (start: number, end: number) => void;
}) {
  const [mode, setMode] = useState<"full" | "range" | null>(null);
  const [start, setStart] = useState<number>(MIN_TASK);
  const [end, setEnd] = useState<number>(MAX_TASK);

  const valid =
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= MIN_TASK &&
    end <= MAX_TASK &&
    start <= end;

  return (
    <div className="mx-auto max-w-xl px-5 py-20">
      <div className="space-y-6 rounded-[28px] bg-white p-8 shadow-[0_12px_32px_rgba(140,130,217,0.16)]">
        <div className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E7E4FA] text-3xl font-extrabold text-[#8C82D9]">
            <span lang="ko">읽</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#2E2A4F]">Выберите тип задания</h2>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => setMode("full")} className={modeCls(mode === "full")}>
            Полный мок
          </button>
          <button type="button" onClick={() => setMode("range")} className={modeCls(mode === "range")}>
            Указать диапазон
          </button>
        </div>

        {mode === "range" && (
          <div className="space-y-4 text-center">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "От задания", value: start, set: setStart, min: MIN_TASK },
                { label: "До задания", value: end, set: setEnd, min: start },
              ].map((f) => (
                <div key={f.label}>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    min={f.min}
                    max={MAX_TASK}
                    value={f.value}
                    onChange={(e) => f.set(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
            {!valid && (
              <p className="text-xs font-bold text-[#E53935]">
                Укажите целые числа от {MIN_TASK} до {MAX_TASK}, где «от» не больше «до»
              </p>
            )}
            <button
              type="button"
              disabled={!valid}
              onClick={() => valid && onStart(start, end)}
              className="w-full cursor-pointer rounded-2xl bg-[#8C82D9] py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#7B73D1] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              Начать решение
            </button>
          </div>
        )}

        {mode === "full" && (
          <div className="space-y-4 text-center">
            <p className="text-sm font-medium text-gray-500">
              Вам предстоит решить полный вариант чтения TOPIK 2
            </p>
            <button
              type="button"
              onClick={() => onStart(MIN_TASK, MAX_TASK)}
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
