"use client";

import { useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createReadingTask, deleteReadingTask } from "@/app/actions/createReading";
import { READING_RANGES } from "@/lib/reading";

export type AdminReadingItem = {
    id: string;
    number: number;
    questionNumber: number | null;
    question: string;
};

const TEMPLATE = `{
  "question": "※ 다음을 읽고 알맞은 것을 고르십시오.",
  "passage": ["...", "..."],
  "example": "",
  "options": ["...", "...", "...", "..."],
  "answer": 1,
  "translation": "",
  "explanation": ""
}`;

export default function ReadingAdminPanel({
    initialReadings,
}: {
    initialReadings: AdminReadingItem[];
}) {
    const [items, setItems] = useState(initialReadings);
    const [type, setType] = useState<number>(1);
    const [json, setJson] = useState("");
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    // Живая проверка JSON
    const jsonError = useMemo(() => {
        if (!json.trim()) return "";
        try {
            const d = JSON.parse(json);
            if (typeof d.question !== "string") return 'Нет поля "question"';
            if (!Array.isArray(d.options) || d.options.length < 2 || d.options.length > 4)
                return '"options": нужен массив из 2–4 элементов';
            const a = Number(d.answer);
            if (!Number.isInteger(a) || a < 1 || a > d.options.length)
                return '"answer": номер правильного варианта (от 1)';
            return "";
        } catch {
            return "Невалидный JSON";
        }
    }, [json]);

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        setPreview(f ? URL.createObjectURL(f) : null);
    };

    const clearFile = () => {
        setPreview(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (jsonError) return;
        setLoading(true);
        setError("");
        setOk("");

        try {
            const fd = new FormData();
            fd.set("json", json);
            fd.set("type", String(type));

            const file = fileRef.current?.files?.[0];
            if (file && file.size > 0) {
                const compressed = await imageCompression(file, {
                    maxSizeMB: 0.3,
                    maxWidthOrHeight: 1200,
                    useWebWorker: true,
                    fileType: "image/webp",
                });
                fd.set("image", compressed, file.name.replace(/\.[^/.]+$/, ".webp"));
            }

            const created = await createReadingTask(fd);
            let question = "";
            try {
                question = JSON.parse(json).question;
            } catch { }
            setItems((prev = []) => [
                { id: created.id, number: created.number, questionNumber: created.questionNumber, question },
                ...prev,
            ]);
            setJson("");
            clearFile();
            setOk(`Задание #${created.number} создано`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Не удалось создать задание");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Удалить это задание?")) return;
        try {
            await deleteReadingTask(id);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Не удалось удалить");
        }
    };

    return (
        <div className="space-y-6">
            <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm"
            >
                <h3 className="text-lg font-semibold text-indigo-900">Создать Reading</h3>

                {error && <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>}
                {ok && <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800">{ok}</div>}

                {/* <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Тип задания</label>
                    <select
                        value={type}
                        onChange={(e) => setType(Number(e.target.value))}
                        className="w-full rounded-lg border bg-white p-2 text-black"
                    >
                       {READING_RANGES.map(([from, to, t]) => (
                            <option key={t} value={t}>
                                Тип {t} (задания {from === to ? from : `${from}–${to}`})
                            </option>
                        ))} 
                    </select>
                </div> */}

                <div>
                    {/* <div className="mb-1 flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">JSON задания</label>
                        <button
                            type="button"
                            onClick={() => setJson(TEMPLATE)}
                            className="text-xs text-indigo-700 hover:underline"
                        >
                            Вставить шаблон
                        </button>
                    </div> */}
                    <textarea
                        value={json}
                        onChange={(e) => setJson(e.target.value)}
                        rows={10}
                        required
                        spellCheck={false}
                        className="w-full rounded-lg border bg-white p-2 font-mono text-xs text-black"
                    />
                    {jsonError && <p className="mt-1 text-xs font-semibold text-red-600">{jsonError}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Изображение (если нужно)
                    </label>
                    <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="w-full" />
                    {preview && (
                        <div className="mt-3 inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="Предпросмотр" className="max-h-60 rounded-lg border object-cover" />
                            <button
                                type="button"
                                onClick={clearFile}
                                className="mt-2 block text-xs text-red-600 hover:underline"
                            >
                                Удалить изображение
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !json.trim() || Boolean(jsonError)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? "Сохранение..." : "Создать Reading"}
                </button>
            </form>

            <div className="rounded-xl border bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold">Reading ({items?.length}):</h3>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                    {items?.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                        >
                            <span className="w-10 shrink-0 font-bold text-indigo-700">#{item.number}</span>
                            <span className="w-14 shrink-0 rounded bg-indigo-100 px-2 py-0.5 text-center text-xs font-semibold text-indigo-800">
                                Тип {item.questionNumber ?? "?"}
                            </span>
                            <span lang="ko" className="min-w-0 flex-1 truncate text-gray-600">
                                {item.question}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="shrink-0 text-xs text-red-600 hover:underline"
                            >
                                Удалить
                            </button>
                        </div>
                    ))}
                    {items?.length === 0 && <p className="text-gray-500">Записей пока нет.</p>}
                </div>
            </div>
        </div>
    );
}