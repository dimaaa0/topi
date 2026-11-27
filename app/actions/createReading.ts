"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { uploadImageToR2 } from "@/lib/r2";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }
}

export async function createReadingTask(formData: FormData) {
  await assertAdmin();

  const raw = formData.get("json") as string | null;
  const imageFile = formData.get("image") as File | null;

  if (!raw) throw new Error("Отсутствует JSON задания.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Ошибка парсинга JSON. Проверьте кавычки и запятые.");
  }

  const entries = Array.isArray(parsed) ? parsed : [parsed];
  if (entries.length === 0) {
    throw new Error("Массив заданий пуст.");
  }

  const tasks = entries.map((entry, index) => {
    const prefix = entries.length > 1 ? `Задание #${index + 1}: ` : "";
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`${prefix}ожидался объект с данными задания.`);
    }

    const data = entry as Record<string, unknown>;
    if (typeof data.question !== "string" || !data.question.trim()) {
      throw new Error(`${prefix}в JSON нужно поле "question" (строка).`);
    }

    const questionNumber = Number(data.question_number);
    if (!Number.isInteger(questionNumber) || questionNumber < 1) {
      throw new Error(`${prefix}"question_number" должен быть целым числом от 1.`);
    }

    const passageIsValid =
      typeof data.passage === "string"
        ? Boolean(data.passage.trim())
        : Array.isArray(data.passage) &&
          data.passage.length > 0 &&
          data.passage.every((line) => typeof line === "string") &&
          data.passage.some((line) => line.trim());
    if (!passageIsValid) {
      throw new Error(`${prefix}"passage" должен быть непустой строкой или массивом строк.`);
    }

    if (!Array.isArray(data.options) || data.options.length < 2 || data.options.length > 4) {
      throw new Error(`${prefix}"options" должен быть массивом из 2–4 вариантов.`);
    }

    const answer = Number(data.answer);
    if (!Number.isInteger(answer) || answer < 1 || answer > data.options.length) {
      throw new Error(`${prefix}"answer" должен быть номером правильного варианта (от 1).`);
    }

    return {
      questionNumber,
      content: { ...data, answer, question_number: questionNumber },
    };
  });

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const ext = imageFile.name.split(".").pop() || "webp";
    imageUrl = await uploadImageToR2(buffer, `topik-reading-${randomUUID()}.${ext}`, imageFile.type);
  }

  const created = await prisma.$transaction(
    tasks.map(({ questionNumber, content }) =>
      prisma.reading.create({
        data: {
          questionNumber,
          imageUrl,
          content: content as object,
        },
        select: { id: true, number: true, questionNumber: true },
      })
    )
  );

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