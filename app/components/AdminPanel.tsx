"use client";

import { useState } from "react";
import { createWriting } from "../actions/createWriting"; // Импортируем наш Action
import { createListeningTask } from '@/app/actions/createListening';

export default function AdminWritingPanel({
  initialWritings,
}: {
  initialWritings: any[];
}) {
  const [writings, setWritings] = useState(initialWritings);
  const [number, setNumber] = useState("");
  const [content, setContent] = useState("");
  const [writingLoading, setWritingLoading] = useState(false);
  const [error, setError] = useState("");

  const [scriptText, setScriptText] = useState('');
  const [listeningLoading, setListeningLoading] = useState(false);
  const [createdPassage, setCreatedPassage] = useState<{
    id: string;
    audioUrl: string;
  } | null>(null);

  const handleListeningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptText.trim()) return;

    setListeningLoading(true);
    setCreatedPassage(null);

    try {
      // Вызываем наш Server Action
      const passage = await createListeningTask(scriptText);
      setCreatedPassage(passage);
    } catch (error) {
      console.error('Ошибка при создании:', error);
      alert('Не удалось сгенерировать аудио.');
    } finally {
      setListeningLoading(false);
    }
  };

  const handleWritingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWritingLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);

      // Вызываем серверный экшен
      await createWriting(formData);

      // Очищаем форму после успешного добавления
      setNumber("");
      setContent("");
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
      <main className="max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Тест генерации Listening (TOPIK)</h1>

        <form onSubmit={handleListeningSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Корейский скрипт:
            </label>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={5}
              placeholder="например: 여보세요. 지금 어디예요? 버스 정류장 앞이에요."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-300 text-black"
            />
          </div>

          <button
            type="submit"
            disabled={listeningLoading || !scriptText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 transition"
          >
            {listeningLoading ? 'Озвучка -> R2 -> База данных...' : 'Сгенерировать и сохранить'}
          </button>
        </form>

        {createdPassage && (
          <div className="p-4 border rounded-lg bg-green-50 border-green-200 space-y-3">
            <h2 className="font-semibold text-green-900">Успешно создано!</h2>
            <p className="text-xs text-gray-600 break-all">
              <strong>Ссылка на R2:</strong> {createdPassage.audioUrl}
            </p>

            {/* Плеер для мгновенной проверки звука */}
            <audio controls src={createdPassage.audioUrl} className="w-full mt-2" />
          </div>
        )}
      </main>
    </div>
  );
}
