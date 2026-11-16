"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function completeListeningTask(taskNumber: number, questionSlot: number) {
  const session = await auth();
  if (!session?.user?.id) return;

  // Обновляем общий прогресс и конкретный слот questionNumber1..10 (если он в пределах 1..10)
  const slotData =
    questionSlot >= 1 && questionSlot <= 10
      ? { [`questionNumber${questionSlot}`]: taskNumber }
      : {};

  await prisma.userProgress.upsert({
    where: { userId: session.user.id },
    update: {
      questionNumber1: taskNumber,
      ...slotData,
    },
    create: {
      userId: session.user.id,
      questionNumber1: taskNumber,
      ...slotData,
    },
  });

  revalidatePath("/listening");
}