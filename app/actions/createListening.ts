"use server";

import { uploadAudioToR2, uploadImageToR2 } from "@/lib/r2";
import { generateDialogueAudio } from "@/lib/tts";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

type TopikTaskData = {
  question_number: number;
  script: string[];
  question: string;
  options?: string[]; // <-- Добавили знак вопроса (теперь это поле необязательно)
  answer: number;
  imageId?: string; // <-- Поле для ID картинки, если она есть
};

export async function createListeningTask(formData: FormData) {
  // 1. Достаем данные из FormData (так как с клиента летит форма с файлом)
  const rawJsonString = formData.get("json") as string;
  const imageFile = formData.get("image") as File | null;
  const customImageId = formData.get("imageId") as string | null;

  if (!rawJsonString) {
    throw new Error("Отсутствует JSON с данными задания.");
  }

  let taskData: TopikTaskData;

  // 2. Парсим JSON (оставил только один try-catch)
  try {
    taskData = JSON.parse(rawJsonString);
  } catch (error) {
    throw new Error("Ошибка парсинга JSON. Проверьте кавычки и запятые.");
  }

  // 3. Проверка на наличие массива script
  if (!taskData?.script || !Array.isArray(taskData?.script)) {
    throw new Error(
      'В JSON отсутствует массив "script". Убедитесь, что вы загружаете правильный формат задания.',
    );
  }

  // 4. Генерация и загрузка аудио
  const audioBuffer = await generateDialogueAudio(taskData.script);
  const audioFilename = `topik-task-${randomUUID()}.mp3`;
  const audioUrl = await uploadAudioToR2(audioBuffer, audioFilename);
  
  let finalImageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = imageFile.name.split(".").pop();

    const filename = customImageId
      ? `${customImageId}.${extension}`
      : `topik-img-${randomUUID()}.${extension}`;

    // Загружаем и сохраняем ПОЛНУЮ ссылку в переменную
    finalImageUrl = await uploadImageToR2(buffer, filename, imageFile.type);
  } else if (customImageId) {
    finalImageUrl = customImageId;
  }

  // Также сохраняем ссылку внутри JSON-контента (по желанию)
  if (finalImageUrl) {
    taskData.imageId = finalImageUrl;
  }

  // 6. Сохранение в базу Neon
  const passage = await prisma.listening.create({
    data: {
      audioUrl: audioUrl,
      imageUrl: finalImageUrl, // <-- Теперь Prisma сохранит ссылку в отдельную колонку БД
      content: taskData as any,
    },
  });

  return passage;
}
