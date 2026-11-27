import Image from "next/image";
import { Fragment } from "react";

// Подсвечивает пропуски: (   ), (ㄱ), (㉠), ____
const BLANK = /(\(\s*[ㄱ-ㅎ㉠-㉣]?\s*\)|_{2,})/;


function renderBlanks(text: string) {
  return text.split(BLANK).map((part, i) => {
    BLANK.lastIndex = 0;
    return BLANK.test(part) ? (
      <span
        key={i}
        className="mx-1 inline-flex min-w-14 items-center justify-center rounded-lg border-2 border-dashed border-[#8C82D9] bg-white px-2 align-middle text-base font-extrabold text-[#7B73D1]"
      >
        {part.replace(/[()_\s]/g, "") || "\u00A0"}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    );
  });
}

function WithBlanks({ text }: { text: string }) {
  return (
    <>
      {text.split(/(<u>.*?<\/u>)/g).map((chunk, i) => {
        const underlined = chunk.match(/^<u>(.*?)<\/u>$/);

        if (underlined) {
          return (
            <u
              key={i}
              className="underline decoration-2 underline-offset-4"
            >
              {renderBlanks(underlined[1])}
            </u>
          );
        }

        return <Fragment key={i}>{renderBlanks(chunk)}</Fragment>;
      })}
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
