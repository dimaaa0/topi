"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { uploadImageToR2 } from "@/lib/r2";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { READING_TYPES } from "@/lib/reading";

async function assertAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }
}

export async function createReadingTask(formData: FormData) {
  await assertAdmin();

  const raw = formData.get("json") as string | null;
  const type = Number(formData.get("type"));
  const imageFile = formData.get("image") as File | null;

  if (!raw) throw new Error("Отсутствует JSON задания.");
  if (!READING_TYPES.some((t) => t.type === type)) {
    throw new Error("Выберите корректный тип задания.");
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Ошибка парсинга JSON. Проверьте кавычки и запятые.");
  }

  if (typeof data.question !== "string" || !data.question.trim()) {
    throw new Error('В JSON нужно поле "question" (строка).');
  }
  if (!Array.isArray(data.options) || data.options.length < 2 || data.options.length > 4) {
    throw new Error('"options" должен быть массивом из 2–4 вариантов.');
  }
  const answer = Number(data.answer);
  if (!Number.isInteger(answer) || answer < 1 || answer > data.options.length) {
    throw new Error('"answer" должен быть номером правильного варианта (от 1).');
  }
  if (
    data.passage !== undefined &&
    typeof data.passage !== "string" &&
    !(Array.isArray(data.passage) && data.passage.every((p) => typeof p === "string"))
  ) {
    throw new Error('"passage" должен быть строкой или массивом строк.');
  }

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const ext = imageFile.name.split(".").pop() || "webp";
    imageUrl = await uploadImageToR2(buffer, `topik-reading-${randomUUID()}.${ext}`, imageFile.type);
  }

  const created = await prisma.reading.create({
    data: {
      questionNumber: type,
      imageUrl,
      content: { ...data, answer, question_number: type } as object,
    },
    select: { id: true, number: true, questionNumber: true },
  });

  revalidatePath("/profile");
  revalidatePath("/reading");
  return created;
}

export async function deleteReadingTask(id: string) {
  await assertAdmin();
  await prisma.reading.delete({ where: { id } });
  revalidatePath("/profile");
  revalidatePath("/reading");
}