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
    select: { questionNumber1: true },
  });

  const lastNum = progress?.questionNumber1 ?? 0;

  const [nextListening, totalListenings, completedCount] = await Promise.all([
    prisma.listening.findFirst({
      where: { number: { gt: lastNum } },
      orderBy: { number: "asc" },
    }),
    prisma.listening.count(),
    prisma.listening.count({ where: { number: { lte: lastNum } } }),
  ]);

  return (
    <ListeningClientView
      initialData={nextListening}
      completedCount={completedCount}
      totalCount={totalListenings}
    />
  );
}