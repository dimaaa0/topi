import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import WritingClientView from "../../components/WritingClientView";

export default async function WritingPage() {
  const session = await auth();

  // Если пользователь не авторизован, можно перенаправить или показать заглушку
  if (!session || !session.user?.id) {
    return (
      <div className="p-8 text-center font-bold">
        Пожалуйста, войдите в систему.
      </div>
    );
  }

  // 1. Получаем данные пользователя (его текущий прогресс)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lastWritingNumber: true, completedWritingCount: true },
  });

  const lastNum = user?.lastWritingNumber || 0;

  // 2. Ищем следующее задание, у которого номер БОЛЬШЕ последнего решенного (gt автоматически пропускает дырки)
  const nextWriting = await prisma.writing.findFirst({
    where: {
      number: { gt: lastNum },
    },
    orderBy: {
      number: "asc",
    },
  });

  // 3. Узнаем общее количество заданий в базе для красивой статистики
  const totalWritings = await prisma.writing.count();

  return (
    <WritingClientView
      initialWriting={nextWriting}
      completedCount={user?.completedWritingCount || 0}
      totalCount={totalWritings}
    />
  );
}
