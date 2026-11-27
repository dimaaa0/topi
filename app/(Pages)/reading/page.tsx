import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import { Suspense } from "react";
import ReadingClientView from "../../components/ReadingClientView";
import { READING_TYPES } from "@/lib/reading";

export default function ReadingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Загрузка...</div>}>
      <ReadingContent />
    </Suspense>
  );
}

async function ReadingContent() {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    return <div className="p-8 text-center font-bold">Пожалуйста, войдите в систему.</div>;
  }

  const row = await prisma.readingProgress.findUnique({
    where: { userId: session.user.id },
    select: { progress: true },
  });
  const lasts = (row?.progress ?? {}) as Record<string, number>;
  const last = (type: number) => lasts[String(type)] ?? 0;

  const [taskGroups, totalCount, completedCount] = await Promise.all([
    Promise.all(
      READING_TYPES.map(({ type, count }) =>
        prisma.reading.findMany({
          where: { questionNumber: type, number: { gt: last(type) } },
          orderBy: { number: "asc" },
          take: count,
        })
      )
    ),
    prisma.reading.count({
      where: { questionNumber: { in: READING_TYPES.map((t) => t.type) } },
    }),
    prisma.reading.count({
      where: {
        OR: READING_TYPES.map(({ type }) => ({
          questionNumber: type,
          number: { lte: last(type) },
        })),
      },
    }),
  ]);

  return (
    <ReadingClientView
      initialData={taskGroups.flat()}
      completedCount={completedCount}
      totalCount={totalCount}
    />
  );
}