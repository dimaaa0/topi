'use server'

import { uploadAudioToR2 } from '@/lib/r2';
import { generateDialogueAudio } from '@/lib/tts';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

type TopikTaskData = {
  script: string[];
  question: string;
  options: string[];
  answer: number;
}

export async function createListeningTask(rawJsonString: string) {
  let taskData: TopikTaskData;

  try {
    taskData = JSON.parse(rawJsonString);
  } catch (error) {
    throw new Error('Ошибка парсинга JSON. Проверьте кавычки и запятые.');
  }

  // Передаем массив строк ["M...", "F..."] в генератор
  const audioBuffer = await generateDialogueAudio(taskData.script);
  const filename = `topik-task-${randomUUID()}.mp3`;

  const audioUrl = await uploadAudioToR2(audioBuffer, filename);

  const passage = await prisma.listening.create({
    data: {
      audioUrl: audioUrl,
      content: taskData, // Сохраняем компактный JSON в базу
    },
  });

  return passage;
}