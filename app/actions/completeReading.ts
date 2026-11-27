"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POINTS, recordActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function completeReadingTask(
  taskNumber: number,
  taskType: number,
  userAnswer: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { isCorrect: false };
  const userId = session.user.id;

  const task = await prisma.reading.findFirst({
    where: { number: taskNumber },
    select: { content: true },
  });
  const right = String((task?.content as { answer?: unknown } | null)?.answer ?? "").trim();
  const isCorrect = right !== "" && right === String(userAnswer).trim();

  const row = await prisma.readingProgress.findUnique({
    where: { userId },
    select: { progress: true },
  });

  const current = (row?.progress ?? {}) as Record<string, number>;
  const key = String(taskType);
  const next = { ...current, [key]: Math.max(current[key] ?? 0, taskNumber) };

  await prisma.readingProgress.upsert({
    where: { userId },
    update: { progress: next },
    create: { userId, progress: next },
  });

  await recordActivity(userId, "READING", {
    correct: isCorrect,
    points: isCorrect ? POINTS.READING_CORRECT : POINTS.READING_WRONG,
  });

  revalidatePath("/reading");
  revalidatePath("/profile");
  return { isCorrect };
}
