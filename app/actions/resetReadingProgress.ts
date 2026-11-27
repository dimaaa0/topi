"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function resetReadingProgress() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.readingProgress.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, progress: {} },
    update: { progress: {} },
  });

  revalidatePath("/reading");
}
