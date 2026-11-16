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
  });

  const lastNum = progress?.questionNumber1 ?? 0;

  // Загружаем ВСЕ задания, которые ещё не пройдены
  const [nextListeningTasks, totalListenings, completedCount] = await Promise.all([
    prisma.listening.findMany({
      where: { number: { gt: lastNum } },
      orderBy: [{ questionNumber: "asc" }, { number: "asc" }],
    }),
    prisma.listening.count(),
    prisma.listening.count({ where: { number: { lte: lastNum } } }),
  ]);

  return (
    <ListeningClientView
      initialData={nextListeningTasks}
      completedCount={completedCount}
      totalCount={totalListenings}
    />
  );
}