// app/actions/generateListening.ts
"use server";

import { uploadAudioToR2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function createListeningTask(scriptText: string) {
  // 1. Здесь должен быть вызов Google Cloud TTS, который вернет аудио буфер
  // const audioContent = await fetchGoogleTTS(scriptText);
  // const audioBuffer = Buffer.from(audioContent, 'binary');

  const audioBuffer = Buffer.from("..."); // Временный псевдокод
  const filename = `topik-task-${randomUUID()}.mp3`;

  // 2. Отправляем файл в Cloudflare R2
  const audioUrl = await uploadAudioToR2(audioBuffer, filename);

  // 3. Сохраняем ссылку в Prisma (Neon)
  const passage = await prisma.Listening.create({
    data: {
      audioUrl: audioUrl,
      script: scriptText,
      playLimit: 2,
    },
  });

  return passage;
}
