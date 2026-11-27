import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import AdminWritingPanel from "../AdminPanel";

// Админка свёрнута по умолчанию, чтобы не перегружать профиль
export default async function AdminSection() {
  await connection();
  const writings = await prisma.writing.findMany({ orderBy: { number: "desc" } });

  return (
    <details className="group rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(140,130,217,0.16)] sm:p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between text-xl font-extrabold">
        Админ-панель
        <span className="text-sm font-bold text-[#7B73D1] group-open:hidden">
          Развернуть
        </span>
        <span className="hidden text-sm font-bold text-[#7B73D1] group-open:inline">
          Свернуть
        </span>
      </summary>
      <div className="pt-5">
        <AdminWritingPanel initialWritings={writings} />
      </div>
    </details>
  );
}
