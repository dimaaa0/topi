export function ReadingExplanation({
  translation,
  explanation,
}: {
  translation?: string;
  explanation?: string;
}) {
  if (!translation && !explanation) return null;

  return (
    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
      {translation && (
        <div className="rounded-2xl bg-[#F4F5FB] p-4">
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-[#8C82D9]">
            Перевод:
          </div>
          <p className="text-sm leading-relaxed text-[#2E2A4F]">{translation}</p>
        </div>
      )}
      {explanation && (
        <div className="rounded-2xl border border-[#FFE082] bg-[#FFF9EB] p-5">
          <h4 className="mb-2 font-extrabold text-[#2E2A4F]">Объяснение</h4>
          <p className="text-sm font-medium leading-relaxed text-gray-700">{explanation}</p>
        </div>
      )}
    </div>
  );
}
