import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import { Suspense } from "react";
import ListeningClientView from "../../components/ListeningClientView";

export default function ListeningPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Загрузка...</div>}>
      <ListeningContent />
    </Suspense>
  );
}

async function ListeningContent() {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    return <div className="p-8 text-center font-bold">Пожалуйста, войдите в систему.</div>;
  }

  const progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
    select: {
      questionNumber1: true,
      questionNumber2: true,
      questionNumber3: true,
    },
  });

  const lastNum1 = progress?.questionNumber1 ?? 0;
  const lastNum2 = progress?.questionNumber2 ?? 0;
  const lastNum3 = progress?.questionNumber3 ?? 0;

  const [q1Tasks, q2Tasks, q3Tasks, totalListenings, completedCount] = await Promise.all([
    // Получаем строго 2 непройденных задания с questionNumber: 1
    prisma.listening.findMany({
      where: {
        questionNumber: 1,
        number: { gt: lastNum1 },
      },
      orderBy: { number: "asc" },
      take: 2,
    }),
    // Получаем строго 1 непройденное задание с questionNumber: 2
    prisma.listening.findMany({
      where: {
        questionNumber: 2,
        number: { gt: lastNum2 },
      },
      orderBy: { number: "asc" },
      take: 1,
    }),
    prisma.listening.findMany({
      where: {
        questionNumber: 3,
        number: { gt: lastNum3 },
      },
      orderBy: { number: "asc" },
      take: 5,
    }),
    prisma.listening.count({
      where: { questionNumber: { in: [1, 2, 3] } },
    }),
    prisma.listening.count({
      where: {
        OR: [
          { questionNumber: 1, number: { lte: lastNum1 } },
          { questionNumber: 2, number: { lte: lastNum2 } },
          { questionNumber: 3, number: { lte: lastNum3 } },
        ],
      },
    }),
  ]);

  const nextListeningTasks = [...q1Tasks, ...q2Tasks, ...q3Tasks];
  console.log(nextListeningTasks);
  
  return (
    <ListeningClientView
      initialData={nextListeningTasks}
      completedCount={completedCount}
      totalCount={totalListenings}
    />
  );
}