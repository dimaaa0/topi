import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Suspense } from "react";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Topi - подготовка к TOPIK II",
  description: "Тренируй чтение, аудирование и письмо для TOPIK II.",
  icons: {
    icon: "../public/mascot.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${nunito.className} bg-[#F4F5FB] text-[#2E2A4F]`}>
        <Navbar />
        <Suspense fallback={<div>Загрузка навигации...</div>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
