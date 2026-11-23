"use client";

type Props = {
  options: Array<string | number>;
  selectedIndex: number;
  correctIndex: number;
  revealed: boolean;
  disabled: boolean;
  onSelect: (value: string) => void;
};

export function ReadingOptions({
  options,
  selectedIndex,
  correctIndex,
  revealed,
  disabled,
  onSelect,
}: Props) {
  // Короткие варианты (1-4 или слова) — сеткой, длинные предложения — списком
  const isShort = options.every((o) => String(o).trim().length <= 4);

  return (
    <div className={isShort ? "grid w-full grid-cols-4 gap-2.5 sm:gap-5" : "flex w-full flex-col gap-3"}>
      {options.map((opt, idx) => {
        const num = String(idx + 1);
        const isSelected = selectedIndex === idx;
        const isCorrect = correctIndex === idx;

        let card = "border-gray-200 bg-white text-[#2E2A4F] sm:hover:border-[#8C82D9] sm:hover:bg-[#F8F7FF] sm:hover:-translate-y-0.5";
        let badge = "bg-[#F4F5FB] text-[#2E2A4F]";

        if (revealed) {
          if (isCorrect) {
            card = "border-[#4CAF50] bg-[#E8F5E9] text-[#2E2A4F]";
            badge = "bg-[#4CAF50] text-white";
          } else if (isSelected) {
            card = "border-[#E53935] bg-[#FFEBEE] text-[#2E2A4F]";
            badge = "bg-[#E53935] text-white";
          } else {
            card = "border-gray-200 bg-white text-[#2E2A4F] opacity-60";
          }
        } else if (isSelected) {
          card = "border-[#8C82D9] bg-[#E7E4FA]/60 text-[#2E2A4F] shadow-[inset_0_-4px_0_rgba(140,130,217,0.18),0_6px_16px_rgba(140,130,217,0.2)]";
          badge = "bg-[#8C82D9] text-white";
        }

        return (
          <label
            key={`${idx}-${num}`}
            className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 shadow-[inset_0_-4px_0_rgba(0,0,0,0.04)] transition-all duration-200 focus-within:ring-4 focus-within:ring-[#8C82D9]/30 active:scale-[0.98] ${
              isShort ? "h-16 justify-center sm:h-20" : "min-h-[60px] px-3.5 py-3 sm:p-4"
            } ${card} ${revealed ? "pointer-events-none" : ""}`}
          >
            <input
              type="radio"
              name="answer"
              value={num}
              checked={isSelected}
              disabled={disabled}
              onChange={(e) => onSelect(e.target.value)}
              className="sr-only"
            />
            {isShort ? (
              <span lang="ko" className="text-2xl font-black sm:text-3xl">
                {String(opt)}
              </span>
            ) : (
              <>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-colors ${badge}`}>
                  {num}
                </span>
                <span lang="ko" className="min-w-0 break-words text-base font-bold leading-snug">
                  {String(opt)}
                </span>
              </>
            )}
          </label>
        );
      })}
    </div>
  );
}
