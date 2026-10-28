"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Обработка входа по почте и паролю
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Отключаем авто-редирект, чтобы перехватить ошибки
      });

      if (result?.error) {
        setError("Неверный email или пароль");
      } else {
        router.push("/profile"); // Куда перенаправить после успешного входа
        router.refresh();
      }
    } catch (err) {
      setError("Произошла ошибка при входе");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
      <h2 className="text-xl font-bold text-white mb-4 text-center">
        Вход в Topi
      </h2>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg">
          {error}
        </div>
      )}

      {/* Форма почта/пароль */}
      <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-slate-800 text-white border border-slate-700 text-sm focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Пароль
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-slate-800 text-white border border-slate-700 text-sm focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg font-medium text-sm transition disabled:opacity-50"
        >
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900 px-2 text-slate-500">или</span>
        </div>
      </div>

      {/* Кнопка входа через Google */}
      <button
        onClick={() => signIn("google", { callbackUrl: "/profile" })}
        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-lg font-medium text-sm transition border border-slate-700"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Войти через Google
      </button>

      <p className="text-xs text-slate-400 text-center mt-4">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-blue-400 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
