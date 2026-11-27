import { prisma } from "@/lib/prisma";

export const TZ = "Asia/Tashkent";
export const DAILY_POINTS_CAP = 300; // защита от фарма баллов
export const POINTS = {
  LISTENING_CORRECT: 10,
  LISTENING_WRONG: 2,
  READING_CORRECT: 10,
  READING_WRONG: 2,
  WRITING_SET: 20,
};

export type Section = "LISTENING" | "READING" | "WRITING";

export function dateKey(d = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
}

export function shiftDate(key: string, days: number) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function levelInfo(points: number) {
  let level = 1;
  let need = 100;
  let rest = points;
  while (rest >= need) {
    rest -= need;
    level++;
    need = Math.round(need * 1.3);
  }
  return { level, into: rest, need };
}

/** Засчитывает визит/активность за сегодня и двигает стрик. Идемпотентна в рамках дня. */
export async function touchStreak(userId: string) {
  const today = dateKey();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
  });
  if (!user || user.lastActiveDate === today) return;

  const streak =
    user.lastActiveDate === shiftDate(today, -1) ? user.currentStreak + 1 : 1;

  // updateMany + условие защищает от гонки (двойной вызов эффекта)
  await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [{ lastActiveDate: null }, { lastActiveDate: { not: today } }],
    },
    data: {
      currentStreak: streak,
      longestStreak: Math.max(user.longestStreak, streak),
      lastActiveDate: today,
    },
  });
}

export async function recordActivity(
  userId: string,
  section: Section,
  opts: { correct: boolean; points: number },
) {
  const today = dateKey();
  const agg = await prisma.activityLog.aggregate({
    where: { userId, date: today },
    _sum: { points: true },
  });
  const room = Math.max(0, DAILY_POINTS_CAP - (agg._sum.points ?? 0));
  const earned = Math.min(opts.points, room);

  await prisma.$transaction([
    prisma.activityLog.upsert({
      where: { userId_date_section: { userId, date: today, section } },
      create: {
        userId,
        date: today,
        section,
        count: 1,
        correct: opts.correct ? 1 : 0,
        points: earned,
      },
      update: {
        count: { increment: 1 },
        correct: { increment: opts.correct ? 1 : 0 },
        points: { increment: earned },
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { points: { increment: earned } },
    }),
  ]);

  await touchStreak(userId);
  return earned;
}
