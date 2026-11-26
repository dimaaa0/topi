"use client";

import { useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createReadingTask, deleteReadingTask } from "@/app/actions/createReading";

export type AdminReadingItem = {
    id: string;
    number: number;
    questionNumber: number | null;
    passage: string;
};

type ParsedReadingItem = {
    question_number: number;
    passage: string | string[];
};

export default function ReadingAdminPanel({
    initialReadings,
}: {
    initialReadings?: AdminReadingItem[];
}) {
    const [items, setItems] = useState(initialReadings ?? []);
    const [json, setJson] = useState("");
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    // Живая проверка JSON и извлечение данных
    const { jsonError, parsedData } = useMemo(() => {
        if (!json.trim()) return { jsonError: "", parsedData: null };

        try {
            const raw = JSON.parse(json);
            const items = Array.isArray(raw) ? raw : [raw];

            if (items.length === 0) {
                return { jsonError: "Массив заданий пуст", parsedData: null };
            }

            const validatedItems: ParsedReadingItem[] = [];

            for (let i = 0; i < items.length; i++) {
                const d = items[i];
                const prefix = items.length > 1 ? `Задание #${i + 1}: ` : "";

                if (!d || typeof d !== "object" || Array.isArray(d)) {
                    return {
                        jsonError: `${prefix}ожидался объект с данными вопроса`,
                        parsedData: null,
                    };
                }

                if (typeof d.question !== "string" || !d.question.trim()) {
                    return {
                        jsonError: `${prefix}нет поля "question"`,
                        parsedData: null,
                    };
                }

                const qNum = Number(d.question_number);
                if (!Number.isInteger(qNum) || qNum < 1) {
                    return {
                        jsonError: `${prefix}"question_number": нужно целое число от 1`,
                        parsedData: null,
                    };
                }

                const passageText =
                    Array.isArray(d.passage) && d.passage.every((line) => typeof line === "string")
                        ? d.passage.join("\n")
                        : d.passage;
                if (typeof passageText !== "string" || !passageText.trim()) {
                    return {
                        jsonError: `${prefix}нет поля "passage"`,
                        parsedData: null,
                    };
                }

                if (!Array.isArray(d.options) || d.options.length < 2 || d.options.length > 4) {
                    return {
                        jsonError: `${prefix}"options": нужен массив из 2–4 элементов`,
                        parsedData: null,
                    };
                }

                const a = Number(d.answer);
                if (!Number.isInteger(a) || a < 1 || a > d.options.length) {
                    return {
                        jsonError: `${prefix}"answer": номер правильного варианта (от 1)`,
                        parsedData: null,
                    };
                }

                validatedItems.push({
                    question_number: qNum,
                    passage: d.passage,
                });
            }

            return {
                jsonError: "",
                parsedData: validatedItems,
            };
        } catch {
            return { jsonError: "Невалидный JSON", parsedData: null };
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
        if (jsonError || !parsedData) return;

        setLoading(true);
        setError("");
        setOk("");

        try {
            const fd = new FormData();
            fd.set("json", json);

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

            setItems((prev = []) => [
                ...created.map((item, index) => ({
                    id: item.id,
                    number: item.number,
                    questionNumber: item.questionNumber,
                    passage: Array.isArray(parsedData[index].passage)
                        ? parsedData[index].passage.join("\n")
                        : parsedData[index].passage,
                })),
                ...prev,
            ]);
            setJson("");
            clearFile();
            setOk(`Создано заданий: ${created.length}`);
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
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-indigo-900">Создать Reading</h3>
                    {parsedData && (
                        <span className="rounded-md bg-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-900">
                            К загрузке: {parsedData.length}
                        </span>
                    )}
                </div>

                {error && <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>}
                {ok && <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800">{ok}</div>}

                <div>
                    <textarea
                        value={json}
                        onChange={(e) => setJson(e.target.value)}
                        placeholder={'[\n  {\n    "question": "...",\n    "question_number": 1,\n    "passage": ["..."],\n    "options": ["...", "..."],\n    "answer": 1\n  },\n  {\n    "question": "...",\n    "question_number": 1,\n    "passage": ["..."],\n    "options": ["...", "..."],\n    "answer": 2\n  }\n]'}
                        rows={10}
                        required
                        spellCheck={false}
                        className="w-full rounded-lg border bg-white p-2 font-mono text-xs text-black"
                    />
                    {jsonError && <p className="mt-1 text-xs font-semibold text-red-600">{jsonError}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Изображение (если нужно; применяется ко всем заданиям)
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
                    {loading ? "Сохранение..." : `Создать заданий: ${parsedData?.length ?? 0}`}
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
                                {item.passage}
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