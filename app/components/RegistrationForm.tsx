"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/register/actions"; // Путь к вашему серверному действию регистрации

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const labelCls = "mb-1.5 block text-sm font-bold text-[#2E2A4F]/70";
const inputCls =
  "w-full rounded-2xl border-2 border-transparent bg-[#F4F5FB] px-4 py-3 font-semibold text-[#2E2A4F] placeholder:text-[#2E2A4F]/35 transition-colors focus:border-[#8C82D9] focus:bg-white focus:outline-none";

export default function AuthPanel() {
  const [isLogin, setIsLogin] = useState(true); // true = Вход, false = Регистрация
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        // Логика входа
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Неверный email или пароль");
        } else {
          router.push("/profile");
          router.refresh();
        }
      } else {
        // Логика регистрации
        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);

        const result = await registerUser(formData);

        if (result?.error) {
          setError(result.error);
        } else {
          // Автоматический вход после успешной регистрации
          const loginResult = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (loginResult?.error) {
            setSuccess("Регистрация успешна! Теперь вы можете войти.");
            setIsLogin(true);
          } else {
            router.push("/profile");
            router.refresh();
          }
        }
      }
    } catch (err) {
      setError("Произошла ошибка. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Переключатель Вход / Регистрация */}
      <div className="mb-6 flex rounded-2xl bg-[#F4F5FB] p-1.5">
        {[
          { login: true, label: "Вход" },
          { login: false, label: "Регистрация" },
        ].map((t) => {
          const active = isLogin === t.login;
          return (
            <button
              key={t.label}
              type="button"
              aria-pressed={active}
              onClick={() => switchMode(t.login)}
              className={`flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-extrabold transition-all ${
                active
                  ? "bg-[#8C82D9] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.1),0_4px_10px_rgba(140,130,217,0.3)]"
                  : "text-[#2E2A4F]/55 hover:text-[#2E2A4F]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-extrabold leading-tight">
          {isLogin ? "Войди в Topi" : "Создай аккаунт"}
        </h1>
        <p className="mt-1.5 font-semibold text-[#2E2A4F]/60">
          {isLogin ? "Рады видеть тебя снова" : "Это займёт меньше минуты"}
        </p>
      </div>

      {/* Ошибки */}
      {error && (
        <div role="alert" className="mt-5 rounded-2xl bg-[#FFE0DC] px-4 py-3 text-sm font-bold text-[#C94F44]">
          {error}
        </div>
      )}

      {/* Успешные сообщения */}
      {success && (
        <div role="status" className="mt-5 rounded-2xl bg-[#c9ffeb] px-4 py-3 text-sm font-bold text-[#1E7A5A]">
          {success}
        </div>
      )}

      {/* Форма */}
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {!isLogin && (
          <div>
            <label htmlFor="auth-name" className={labelCls}>
              Имя
            </label>
            <input
              id="auth-name"
              type="text"
              autoComplete="name"
              placeholder="Как тебя зовут"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              required={!isLogin}
            />
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className={labelCls}>
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            required
          />
        </div>

        <div>
          <label htmlFor="auth-password" className={labelCls}>
            Пароль
          </label>
          <div className="relative">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-24`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-xl px-3 py-1.5 text-sm font-bold text-[#7B73D1] transition-colors hover:bg-[#E7E4FA]"
            >
              {showPassword ? "Скрыть" : "Показать"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full cursor-pointer rounded-2xl bg-[#FF8A80] py-3.5 font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#FF9A91] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Обработка..." : isLogin ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>

      {/* Разделитель */}
      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-0.5 flex-1 rounded-full bg-[#8C82D9]/15" />
        <span className="text-sm font-bold text-[#2E2A4F]/40">или</span>
        <span className="h-0.5 flex-1 rounded-full bg-[#8C82D9]/15" />
      </div>

      {/* Кнопка Google */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/profile" })}
        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-[#E7E4FA] bg-white py-3.5 font-extrabold shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_-4px_0_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#8C82D9]/50"
      >
        <GoogleIcon />
        Продолжить с Google
      </button>
    </div>
  );
}