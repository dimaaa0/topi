import React from "react";
import Link from "next/link";

const Navbar = () => {
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

  return (
    <div className="relative mx-auto flex max-w-5xl flex-col px-5 pt-5 sm:px-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 rounded-full pr-3">
          <span className="text-4xl font-extrabold tracking-tight text-[#7B73D1]">
            Topi
          </span>
          <Sparkle
            className="mb-5 h-4 w-4 motion-safe:animate-pulse"
            color="#FF8A80"
          />
        </Link>

        <nav
          aria-label="Основная навигация"
          className="flex items-center gap-1 rounded-full bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
        >
          <Link
            href="/"
            className="rounded-full bg-[#8C82D9] px-4 py-2 text-sm font-bold text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.1)]"
          >
            Главная
          </Link>
          <Link
            href="/profile"
            className="rounded-full px-4 py-2 text-sm font-bold text-[#2E2A4F]/70 transition-colors hover:bg-[#F4F5FB] hover:text-[#2E2A4F]"
          >
            Профиль
          </Link>
        </nav>
      </header>
    </div>
  );
};

export default Navbar;
