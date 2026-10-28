import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import mascot from "@/public/mascot.png";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import RegistrationForm from "../../components/RegistrationForm";
import LoginForm from "../../components/LoginForm";

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
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
  const session = await auth();
  const user = session?.user;
  const initial = (user?.name ?? user?.email ?? "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="relative min-h-dvh overflow-hidden">
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

      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-10 pt-5 sm:px-8">
        <main className="flex flex-1 items-center justify-center py-10">
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
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="mx-auto mt-2 max-w-xs font-semibold leading-relaxed text-[#2E2A4F]/60">
                     
                    </p>
                  </div>
                  <RegistrationForm />
                  {/* <div className="mt-7 flex flex-col gap-3">
                    <form
                      action={async () => {
                        "use server";
                        await signIn("google", { redirectTo: "/profile" });
                      }}
                    >
                      <button
                        type="submit"
                        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-[#E7E4FA] bg-white py-3.5 font-extrabold shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_-4px_0_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#8C82D9]/50"
                      >
                        <GoogleIcon />
                        Войти через Google
                      </button>
                    </form>
                  </div> */}

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
