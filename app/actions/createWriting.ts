"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createWriting(formData: FormData) {
  const session = await auth();

  // Проверяем, что пользователь действительно админ
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Недостаточно прав для добавления записей");
  }

  const contentStr = formData.get("content") as string;

  let contentJson;
  try {
    contentJson = JSON.parse(contentStr);
  } catch (e) {
    throw new Error("Ошибка: введён невалидный JSON");
  }

  await prisma.writing.create({
    data: {
      content: contentJson,
    },
  });

  // Обновляем страницу профиля, чтобы данные сразу появились в списке
  revalidatePath("/profile");
}
