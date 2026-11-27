"use client";

import { useEffect } from "react";
import { checkIn } from "../actions/checkIn";

// Засчитывает визит за сегодня (стрик). Сервер идемпотентен, sessionStorage лишь экономит запросы.
export default function DailyCheckIn() {
  useEffect(() => {
    const key = "topi_checkin";
    const today = new Date().toDateString();
    try {
      if (sessionStorage.getItem(key) === today) return;
      sessionStorage.setItem(key, today);
    } catch {}
    checkIn().catch(() => {});
  }, []);
  return null;
}
