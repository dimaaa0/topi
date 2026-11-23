"use client";

import type { SlotState } from "@/lib/reading";

export function ReadingNavigator({
  slots,
  active,
  answers,
  hasData,
  onSelect,
}: {
  slots: number[];
  active: number;
  answers: Record<number, SlotState>;
  hasData: (slot: number) => boolean;
  onSelect: (slot: number) => void;
}) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto rounded-3xl bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
      {slots.map((n) => {
        const isActive = active === n;
        const solved = answers[n]?.isRevealed;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            className={`min-w-[48px] shrink-0 cursor-pointer rounded-[20px] px-3 py-2.5 text-center transition-all ${
              isActive
                ? "bg-[#8C82D9] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1),0_6px_14px_rgba(140,130,217,0.3)]"
                : solved
                  ? "bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]"
                  : hasData(n) || answers[n]
                    ? "text-[#2E2A4F] hover:bg-[#E7E4FA]"
                    : "text-gray-300"
            }`}
          >
            <span className="block font-extrabold">{n}</span>
          </button>
        );
      })}
    </div>
  );
}
