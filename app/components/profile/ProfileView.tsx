import { Suspense } from "react";
import { signOut } from "@/auth";
import mascot from "@/public/mascot.png";
import RegistrationForm from "../RegistrationForm";
import ProfileStats from "./ProfileStats";
import AdminSection from "./AdminSection";

type ProfileUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
};

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

function Background() {
  return (
    <>
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
    </>
  );
}

/* ---------- Гость: вход / регистрация ---------- */
function GuestView() {
  return (
    <div className="relative mx-auto flex max-w-5xl flex-col px-5 pt-5 sm:px-8">
      <div className="relative mx-auto mt-4 w-full max-w-md">
        <div className="relative z-10 mx-auto -mb-10 h-36 w-36">
          <div
            aria-hidden="true"
            className="absolute inset-2 rounded-full bg-[#E7E4FA] shadow-[inset_0_-8px_0_rgba(123,115,209,0.14),inset_0_6px_0_rgba(255,255,255,0.7)]"
          />
          <div className="animate-float absolute inset-0 flex items-center justify-center">
            <img src={mascot.src} alt="" width={120} height={120} />
          </div>
          <Sparkle className="absolute -left-3 top-4 h-5 w-5 motion-safe:animate-pulse" color="#FFAB91" />
          <Sparkle className="absolute -right-2 bottom-6 h-4 w-4" color="#8C82D9" />
        </div>

        <div className="rounded-[28px] bg-white px-6 pb-7 pt-14 shadow-[0_12px_32px_rgba(140,130,217,0.16)] sm:px-8">
          <RegistrationForm />
          <p className="mt-5 text-center text-sm font-semibold text-[#2E2A4F]/45">
            Можно войти через Google, пароль придумывать не нужно.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Авторизованный пользователь ---------- */
function UserView({ user }: { user: ProfileUser }) {
  const initial = (user.name ?? user.email ?? "?").trim().charAt(0).toUpperCase();
  const firstName = user.name?.split(" ")[0] ?? "ученик";
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="relative mx-auto max-w-5xl px-5 pt-5 sm:px-8">
      {/* Шапка */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#a89ff0] to-[#7B73D1] p-6 text-white shadow-[0_16px_36px_rgba(140,130,217,0.35),inset_0_-6px_0_rgba(0,0,0,0.08)] sm:p-8">
        <div aria-hidden="true" className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div aria-hidden="true" className="absolute -bottom-14 right-28 h-32 w-32 rounded-full bg-[#FF8A80]/30" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.35)_1.5px,transparent_1.5px)] [background-size:22px_22px]"
        />
        <Sparkle className="absolute right-40 top-5 hidden h-5 w-5 motion-safe:animate-pulse sm:block" color="#FFAB91" />

        <div className="relative flex items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="shrink-0 rounded-full bg-white/90 p-1 shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  width={72}
                  height={72}
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 rounded-full object-cover sm:h-[72px] sm:w-[72px]"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7E4FA] text-2xl font-extrabold text-[#7B73D1] sm:h-[72px] sm:w-[72px]">
                  {initial}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold leading-tight sm:text-4xl">
                Привет, {firstName}!
              </h1>
              <p className="mt-1 truncate font-semibold text-white/85">
                {user.email || "Почта скрыта настройками профиля"}
              </p>
              <form
                className="mt-3"
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="cursor-pointer rounded-full bg-white/20 px-4 py-1.5 text-sm font-extrabold text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.1)] transition-colors hover:bg-white/30"
                >
                  Выйти
                </button>
              </form>
            </div>
          </div>

          <div className="animate-float hidden shrink-0 sm:block">
            <img src={mascot.src} alt="" width={140} height={140} />
          </div>
        </div>
      </section>

      {/* Статистика, лидерборд, друзья */}
      <Suspense
        fallback={
          <div className="mt-8 text-center font-semibold text-[#2E2A4F]/50">
            Загрузка статистики...
          </div>
        }
      >
        <ProfileStats userId={user.id} />
      </Suspense>

      {isAdmin && (
        <div className="mt-6">
          <Suspense fallback={null}>
            <AdminSection />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default function ProfileView({ user }: { user: ProfileUser | null }) {
  return (
    <div className="relative overflow-hidden pb-10">
      <Background />
      {user ? <UserView user={user} /> : <GuestView />}
    </div>
  );
}
