"use client";

import { useState } from "react";
import { createWriting } from "../actions/createWriting"; // Импортируем наш Action

export default function AdminWritingPanel({
  initialWritings,
}: {
  initialWritings: any[];
}) {
  const [writings, setWritings] = useState(initialWritings);
  const [number, setNumber] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Форма добавления нового задания Writing */}
      <form
        onSubmit={handleSubmit}
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
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
        >
          {loading ? "Сохранение в базу..." : "Добавить запись"}
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
              <pre className="text-xs bg-gray-50 w-full p-2 rounded max-w-full md:max-w-md overflow-x-auto text-gray-600">
                {item.content?.topik_writing_tasks?.[0]?.content.slice(0, 25) || "Текст не найден"}
              </pre>
            </div>
          ))}
          {writings.length === 0 && (
            <p className="text-gray-500">Записей пока нет.</p>
          )}
        </div>
      </div>
    </div>
  );
}
