"use client";

import { useState, useRef, useTransition } from "react";
import { createWriting } from "../actions/createWriting";
import { createListeningTask } from "@/app/actions/createListening";
import imageCompression from 'browser-image-compression';

export default function AdminWritingPanel({
  initialWritings,
}: {
  initialWritings: any[];
}) {
  // === Стейты для Writing ===
  const [writings, setWritings] = useState(initialWritings);
  const [number, setNumber] = useState("");
  const [content, setContent] = useState("");
  const [writingLoading, setWritingLoading] = useState(false);
  const [error, setError] = useState("");

  // === Стейты для Listening ===
  const [listeningLoading, setListeningLoading] = useState(false);
  const [createdPassage, setCreatedPassage] = useState<{
    id: string;
    audioUrl: string;
  } | null>(null);

  // === Обработчик для Listening (аудио + картинка + JSON) ===
  const handleListeningSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; 
    setListeningLoading(true);
    setCreatedPassage(null);

    try {
      const formData = new FormData(form);
      const imageFile = formData.get('image') as File | null;

      // Если файл есть и он не пустой, сжимаем его
      if (imageFile && imageFile.size > 0) {
        const options = {
          maxSizeMB: 0.3,          
          maxWidthOrHeight: 1200, 
          useWebWorker: true,
          fileType: 'image/webp' 
        };

        // Сжимаем
        const compressedFile = await imageCompression(imageFile, options);
        
        // Заменяем тяжелый оригинал на легкий файл в formData
        formData.set('image', compressedFile, compressedFile.name.replace(/\.[^/.]+$/, ".webp"));
      }
      
      // Отправляем УЖЕ СЖАТЫЙ файл на сервер
      const passage = await createListeningTask(formData);
      
      setCreatedPassage(passage as any); 
      form.reset(); 
      alert('Задание Listening успешно создано!');
    } catch (error: any) {
      console.error('Ошибка при создании:', error);
      alert(error.message || 'Не удалось создать задание Listening.');
    } finally {
      setListeningLoading(false);
    }
  };

  // === Обработчик для Writing ===
  const handleWritingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWritingLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);

      await createWriting(formData);

      setNumber("");
      setContent("");
      alert("Задание Writing успешно добавлено!");
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при сохранении");
    } finally {
      setWritingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Форма добавления нового задания Writing */}
      <form
        onSubmit={handleWritingSubmit}
        className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm space-y-4"
      >
        <h3 className="text-lg font-semibold text-purple-900">
          Добавить новое задание
        </h3>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Контент
          </label>
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={5}
            className="w-full border rounded-lg p-2 font-mono text-xs bg-white text-black"
            placeholder='{"task": "...", "questions": [...] }'
          />
        </div>

        <button
          type="submit"
          disabled={writingLoading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
        >
          {writingLoading ? (
            <div className="flex h-6 items-center gap-1.5">
              <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-white [animation-delay:-0.2s]"></div>
              <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-white [animation-delay:-0.1s]"></div>
              <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-white"></div>
            </div>
          ) : (
            "Добавить запись"
          )}
        </button>
      </form>

      {/* Список существующих заданий */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <h3 className="text-lg font-semibold mb-4">
          Существующие задания в базе
        </h3>
        <div className="space-y-3 ">
          {writings.map((item) => (
            <div
              key={item.id}
              className="py-4 px-2 border max-h-20 overflow-hidden rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center"
            >
              <div className="max-w-7 flex w-full items-center justify-center">
                <span className="font-bold flex items-center text-purple-700">
                  {item.number}
                </span>
              </div>
              <pre className="text-xs w-full p-2 rounded max-w-full md:max-w-md overflow-x-auto text-gray-600">
                {item.content?.topik_writing_tasks?.[0]?.content
                  .slice(0, 25)
                  .replace(/\n/g, "") || "Текст не найден"}
              </pre>
            </div>
          ))}
          {writings.length === 0 && (
            <p className="text-gray-500">Записей пока нет.</p>
          )}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Создать Listening</h2>
        <form onSubmit={handleListeningSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              JSON Задания
            </label>
            <textarea
              name="json"
              rows={8}
              className="w-full border rounded p-2 text-black font-mono text-sm"
              placeholder='{
  "script": ["M...", "F..."], 
  "question": "...", 
  "answer": 3
}'
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Изображение (если нужно)
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={listeningLoading}
            className="bg-green-600 text-white p-2 rounded disabled:opacity-50"
          >
            {listeningLoading
              ? "Генерация аудио и сохранение..."
              : "Создать Listening"}
          </button>

          {createdPassage && (
            <div className="mt-4 p-4 bg-green-50 text-green-900 rounded">
              Успешно! ID: {createdPassage.id}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
