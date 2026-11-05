import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import mascot from "@/public/mascot.png";
import RegistrationForm from "../../components/RegistrationForm";
import { Writing } from "@prisma/client";
import { prisma } from "@/lib/prisma";

import AdminWritingPanel from "../../components/AdminPanel";

export const instant = false;

function Sparkle({
  className = "",
  color = "#8C82D9",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 1c.8 5.6 3.4 9.2 11 11-7.6 1.8-10.2 5.4-11 11-.8-5.6-3.4-9.2-11-11C8.6 10.2 11.2 6.6 12 1z"
        fill={color}
      />
    </svg>
  );
}

const quickLinks = [
  { href: "/reading", label: "Чтение", ko: "읽기" },
  { href: "/listening", label: "Аудирование", ko: "듣기" },
  { href: "/writing", label: "Письмо", ko: "쓰기" },
];

/* ---------- Страница ---------- */

const Profile = async () => {
  const session = auth ? await auth() : null;
  const user = session?.user;
  const initial = (user?.name ?? user?.email ?? "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  const isAdmin = session?.user.role === "ADMIN";

  // Если админ, подтягиваем данные заданий writing из Neon

  // Вместо any[] используем типизированный массив
  let writings: Writing[] = [];

  if (isAdmin) {
    writings = await prisma.writing.findMany({
      orderBy: { number: "desc" },
    });
  }

  return (
    <div className="relative pb-6 overflow-hidden">
      {/* фон */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(140,130,217,0.22)_1.5px,transparent_1.5px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#8C82D9]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-72 h-72 w-72 rounded-full bg-[#FFAB91]/20 blur-3xl"
      />

      <div className="relative mx-auto flex  max-w-5xl flex-col px-5 pt-5 sm:px-8">
        <main className="flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-md">
            <div className="relative z-10 mx-auto -mb-10 h-36 w-36">
              <div
                aria-hidden="true"
                className="absolute inset-2 rounded-full bg-[#E7E4FA] shadow-[inset_0_-8px_0_rgba(123,115,209,0.14),inset_0_6px_0_rgba(255,255,255,0.7)]"
              />
              <div className="animate-float absolute inset-0 flex items-center justify-center">
                <img src={mascot.src} alt="" width={120} height={120} />
              </div>
              <Sparkle
                className="absolute -left-3 top-4 h-5 w-5 motion-safe:animate-pulse"
                color="#FFAB91"
              />
              <Sparkle
                className="absolute -right-2 bottom-6 h-4 w-4"
                color="#8C82D9"
              />
            </div>

            <div className="rounded-[28px] bg-white px-6 pb-7 pt-14 shadow-[0_12px_32px_rgba(140,130,217,0.16)] sm:px-8">
              {user ? (
                <>
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-gradient-to-br from-[#8C82D9] to-[#FF8A80] p-1 shadow-[0_8px_20px_rgba(140,130,217,0.3)]">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          width={84}
                          height={84}
                          referrerPolicy="no-referrer"
                          className="h-[84px] w-[84px] rounded-full border-4 border-white object-cover"
                        />
                      ) : (
                        <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-4 border-white bg-[#E7E4FA] text-3xl font-extrabold text-[#7B73D1]">
                          {initial}
                        </div>
                      )}
                    </div>

                    <h1 className="mt-4 text-2xl font-extrabold leading-tight">
                      Привет, {user.name?.split(" ")[0] ?? "ученик"}!
                    </h1>
                    <p className="mt-1 break-all font-semibold text-[#2E2A4F]/55">
                      {user.email || "Почта скрыта настройками профиля"}
                    </p>
                  </div>

                  <div className="mt-6 rounded-2xl bg-[#F4F5FB] p-4">
                    <p className="font-bold">Продолжить занятия</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quickLinks.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-bold shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_-3px_0_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-0.5"
                        >
                          {l.label}
                          <span lang="ko" className="text-[#8C82D9]">
                            {l.ko}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <form
                    className="mt-5"
                    action={async () => {
                      "use server";
                      await signOut();
                    }}
                  >
                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-2xl bg-[#FFE0DC] py-3.5 font-extrabold text-[#E5675C] shadow-[inset_0_-4px_0_rgba(0,0,0,0.06)] transition-colors hover:bg-[#FFD3CD]"
                    >
                      Выйти
                    </button>
                  </form>
                  {isAdmin && (
                    <div className=" pt-6">
                      <AdminWritingPanel initialWritings={writings} />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="mx-auto mt-2 max-w-xs font-semibold leading-relaxed text-[#2E2A4F]/60"></p>
                  </div>
                  <RegistrationForm />
                  <p className="mt-5 text-center text-sm font-semibold text-[#2E2A4F]/45">
                    Пароль не нужен: вход идёт через выбранный аккаунт.
                  </p>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
