"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function completeReadingTask(taskNumber: number, taskType: number) {
  const session = await auth();
  if (!session?.user?.id) return;

  const row = await prisma.readingProgress.findUnique({
    where: { userId: session.user.id },
    select: { progress: true },
  });

  const current = (row?.progress ?? {}) as Record<string, number>;
  const key = String(taskType);
  const next = { ...current, [key]: Math.max(current[key] ?? 0, taskNumber) };

  await prisma.readingProgress.upsert({
    where: { userId: session.user.id },
    update: { progress: next },
    create: { userId: session.user.id, progress: next },
  });

  revalidatePath("/reading");
}
