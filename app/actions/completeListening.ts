"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POINTS, recordActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function completeListeningTask(
  taskNumber: number,
  questionSlot: number,
  userAnswer: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { isCorrect: false };
  const userId = session.user.id;

  // Правильность проверяем на сервере, а не берём с клиента
  const task = await prisma.listening.findFirst({
    where: { number: taskNumber },
    select: { content: true },
  });
  const right = String((task?.content as { answer?: unknown } | null)?.answer ?? "").trim();
  const isCorrect = right !== "" && right === String(userAnswer).trim();

  // Обновляем конкретный слот questionNumber1..10 (если он в пределах 1..10)
  const slotData =
    questionSlot >= 1 && questionSlot <= 10
      ? { [`questionNumber${questionSlot}`]: taskNumber }
      : {};

  await prisma.userProgress.upsert({
    where: { userId },
    update: { ...slotData },
    create: { userId, ...slotData },
  });

  await recordActivity(userId, "LISTENING", {
    correct: isCorrect,
    points: isCorrect ? POINTS.LISTENING_CORRECT : POINTS.LISTENING_WRONG,
  });

  revalidatePath("/listening");
  revalidatePath("/profile");
  return { isCorrect };
}
