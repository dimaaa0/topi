import Image from "next/image";

// Подсвечивает пропуски: (   ), (ㄱ), (㉠), ____
const BLANK = /(\(\s*[ㄱ-ㅎ㉠-㉣]?\s*\)|_{2,})/;

function WithBlanks({ text }: { text: string }) {
  return (
    <>
      {text.split(BLANK).map((part, i) =>
        BLANK.test(part) ? (
          <span
            key={i}
            className="mx-1 inline-flex min-w-14 items-center justify-center rounded-lg border-2 border-dashed border-[#8C82D9] bg-white px-2 align-middle text-base font-extrabold text-[#7B73D1]"
          >
            {part.replace(/[()_\s]/g, "") || "\u00A0"}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function ReadingPassage({
  question,
  passage,
  example,
  imageUrl,
  alt,
}: {
  question?: string;
  passage?: string | string[];
  example?: string;
  imageUrl?: string | null;
  alt: string;
}) {
  const lines = Array.isArray(passage)
    ? passage
    : passage
      ? passage.split(/\n+/).filter(Boolean)
      : [];

  return (
    <section className="relative mb-6 w-full space-y-4">
      <p lang="ko" className="text-lg font-bold text-[#2E2A4F]">
        {question || "Текст задания не найден."}
      </p>

      {example && (
        <div lang="ko" className="rounded-2xl border border-[#E7E4FA] bg-[#FAF9FF] p-4 text-base font-semibold leading-relaxed">
          <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#8C82D9]">
            보기
          </div>
          <WithBlanks text={example} />
        </div>
      )}

      {lines.length > 0 && (
        <div lang="ko" className="space-y-2 rounded-2xl bg-[#F4F5FB] p-4 text-base font-semibold leading-[2] text-[#2E2A4F] sm:p-5">
          {lines.map((line, i) => (
            <p key={i}>
              <WithBlanks text={line} />
            </p>
          ))}
        </div>
      )}

      {imageUrl && (
        <Image
          className="mt-2 rounded-2xl sm:w-[80%]"
          src={imageUrl}
          alt={alt}
          width={600}
          height={400}
        />
      )}
    </section>
  );
}
