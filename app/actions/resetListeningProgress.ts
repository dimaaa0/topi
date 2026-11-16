'use server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function resetListeningProgress() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.userProgress.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {
      questionNumber1: 0,
      questionNumber2: 0,
      questionNumber3: 0,
      questionNumber4: 0,
      questionNumber5: 0,
      questionNumber6: 0,
      questionNumber7: 0,
      questionNumber8: 0,
      questionNumber9: 0,
      questionNumber10: 0,
    },
  });

  revalidatePath("/listening");
}