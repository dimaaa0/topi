"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function completeTask(Number: number, Task: string) {
  const session = await auth();
  if (!session || !session.user?.id) throw new Error("Не авторизован");

  const lastNumber = "last" + Task + "Number"; // lastWritingNumber, lastReadingNumber, lastListeningNumber
  const completedCount = "completed" + Task + "Count";

  // Обновляем прогресс пользователя в один клик
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      [lastNumber]: Number, // Запоминаем номер свежего решенного задания
      [completedCount]: { increment: 1 }, // Безопасно увеличиваем счетчик на 1
    },
  });

  revalidatePath("/profile");
}
