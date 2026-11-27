"use client";

import { useState, useTransition } from "react";
import {
  removeFriend,
  respondToRequest,
  sendFriendRequest,
} from "@/app/actions/friends";

type Props = {
  friendCode: string;
  incoming: { id: string; name: string }[];
  friends: { friendshipId: string; name: string }[];
};

export default function FriendsPanel({ friendCode, incoming, friends }: Props) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const add = () =>
    start(async () => {
      const r = await sendFriendRequest(code);
      if (r.error) setMsg({ type: "err", text: r.error });
      else {
        setMsg({ type: "ok", text: r.ok ?? "Готово" });
        setCode("");
      }
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(140,130,217,0.16)] sm:p-6">
      <h2 className="mb-4 text-xl font-extrabold">Моя команда</h2>

      <div className="rounded-2xl bg-[#F4F5FB] p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#2E2A4F]/50">
          Твой код
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="font-mono text-2xl font-extrabold tracking-widest text-[#7B73D1]">
            {friendCode || "—"}
          </span>
          <button
            type="button"
            onClick={copy}
            className="cursor-pointer rounded-xl bg-white px-3 py-2 text-sm font-extrabold shadow-[inset_0_-3px_0_rgba(0,0,0,0.06)]"
          >
            {copied ? "Скопировано ✓" : "Копировать"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={12}
          placeholder="Код друга"
          className="min-w-0 flex-1 rounded-2xl border-2 border-transparent bg-[#F4F5FB] px-4 py-3 font-mono font-bold uppercase focus:border-[#8C82D9] focus:bg-white focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !code.trim()}
          className="cursor-pointer rounded-2xl bg-[#FF8A80] px-4 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Добавить
        </button>
      </div>
      {msg && (
        <p
          role="status"
          className={`mt-2 text-sm font-bold ${
            msg.type === "ok" ? "text-[#1E7A5A]" : "text-[#C94F44]"
          }`}
        >
          {msg.text}
        </p>
      )}

      {incoming.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#2E2A4F]/50">
            Заявки
          </div>
          {incoming.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-2xl bg-[#FFF9EB] px-3 py-2"
            >
              <span className="truncate font-bold">{r.name}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(() => respondToRequest(r.id, true))}
                  className="cursor-pointer rounded-xl bg-green-500 px-3 py-1.5 text-sm font-extrabold text-white"
                >
                  Принять
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(() => respondToRequest(r.id, false))}
                  className="cursor-pointer rounded-xl bg-gray-200 px-3 py-1.5 text-sm font-extrabold"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {friends.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#2E2A4F]/50">
            В команде
          </div>
          {friends.map((f) => (
            <div
              key={f.friendshipId}
              className="flex items-center justify-between rounded-2xl bg-[#F4F5FB] px-3 py-2"
            >
              <span className="truncate font-bold">{f.name}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  confirm(`Убрать ${f.name} из команды?`) &&
                  start(() => removeFriend(f.friendshipId))
                }
                className="cursor-pointer text-sm font-bold text-[#C94F44] hover:underline"
              >
                Убрать
              </button>
            </div>
          ))}
          
        </div>
      )}
    </section>
  );
}
