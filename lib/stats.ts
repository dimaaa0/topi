import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { dateKey, levelInfo, shiftDate } from "@/lib/activity";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () =>
  Array.from(randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join("");

async function ensureFriendCode(userId: string, current: string | null) {
  if (current) return current;
  for (let i = 0; i < 5; i++) {
    try {
      const u = await prisma.user.update({
        where: { id: userId },
        data: { friendCode: makeCode() },
        select: { friendCode: true },
      });
      return u.friendCode ?? "";
    } catch {
      /* коллизия кода — пробуем ещё раз */
    }
  }
  return "";
}

const U = {
  id: true,
  name: true,
  image: true,
  points: true,
  currentStreak: true,
  lastActiveDate: true,
} as const;

export type LeaderRow = {
  id: string;
  name: string;
  image: string | null;
  weekPoints: number;
  totalPoints: number;
  streak: number;
  isMe: boolean;
};

export async function getProfileStats(userId: string) {
  const today = dateKey();
  const yesterday = shiftDate(today, -1);
  const heatFrom = shiftDate(today, -83);
  const weekFrom = shiftDate(today, -6);
  const liveStreak = (cur: number, last: string | null) =>
    last === today || last === yesterday ? cur : 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...U, longestStreak: true, friendCode: true },
  });
  if (!user) return null;

  const [friendCode, logs, totals, accepted, incoming] = await Promise.all([
    ensureFriendCode(userId, user.friendCode),
    prisma.activityLog.findMany({
      where: { userId, date: { gte: heatFrom } },
      select: { date: true, count: true, points: true },
    }),
    prisma.activityLog.groupBy({
      by: ["section"],
      where: { userId },
      _sum: { count: true, correct: true },
    }),
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: { requester: { select: U }, addressee: { select: U } },
    }),
    prisma.friendship.findMany({
      where: { status: "PENDING", addresseeId: userId },
      include: { requester: { select: { name: true } } },
    }),
  ]);

  // --- по дням ---
  const byDay = new Map<string, { count: number; points: number }>();
  for (const l of logs) {
    const cur = byDay.get(l.date) ?? { count: 0, points: 0 };
    byDay.set(l.date, {
      count: cur.count + l.count,
      points: cur.points + l.points,
    });
  }
  const heat = Array.from({ length: 84 }, (_, i) => {
    const date = shiftDate(heatFrom, i);
    return { date, count: byDay.get(date)?.count ?? 0 };
  });
  const days14 = heat.slice(-14).map((h) => ({
    ...h,
    points: byDay.get(h.date)?.points ?? 0,
  }));

  // --- по разделам ---
  const sec = (name: string) => {
    const t = totals.find((x) => x.section === name);
    const count = t?._sum.count ?? 0;
    const correct = t?._sum.correct ?? 0;
    return {
      count,
      correct,
      accuracy: count ? Math.round((correct / count) * 100) : null,
    };
  };
  const listening = sec("LISTENING");
  const reading = sec("READING");
  const writing = sec("WRITING");
  const totalTasks = listening.count + reading.count + writing.count;

  // Общая точность — только по разделам с проверкой ответа (чтение + аудирование)
  const checked = listening.count + reading.count;
  const accuracy = checked
    ? Math.round(((listening.correct + reading.correct) / checked) * 100)
    : null;

  // --- друзья и лидерборд ---
  const friends = accepted.map((f) => ({
    friendshipId: f.id,
    ...(f.requesterId === userId ? f.addressee : f.requester),
  }));
  const ids = [userId, ...friends.map((f) => f.id)];
  const week = await prisma.activityLog.groupBy({
    by: ["userId"],
    where: { userId: { in: ids }, date: { gte: weekFrom } },
    _sum: { points: true },
  });
  const weekMap = new Map(week.map((w) => [w.userId, w._sum.points ?? 0]));

  const leaderboard: LeaderRow[] = [
    {
      id: user.id,
      name: user.name ?? "Вы",
      image: user.image,
      weekPoints: weekMap.get(user.id) ?? 0,
      totalPoints: user.points,
      streak: liveStreak(user.currentStreak, user.lastActiveDate),
      isMe: true,
    },
    ...friends.map((f) => ({
      id: f.id,
      name: f.name ?? "Без имени",
      image: f.image,
      weekPoints: weekMap.get(f.id) ?? 0,
      totalPoints: f.points,
      streak: liveStreak(f.currentStreak, f.lastActiveDate),
      isMe: false,
    })),
  ].sort((a, b) => b.weekPoints - a.weekPoints || b.totalPoints - a.totalPoints);

  const streak = liveStreak(user.currentStreak, user.lastActiveDate);

  const badges = [
    { id: "first", emoji: "🌱", title: "Первый шаг", desc: "Реши первое задание", earned: totalTasks >= 1 },
    { id: "s3", emoji: "🔥", title: "3 дня подряд", desc: "Стрик 3 дня", earned: user.longestStreak >= 3 },
    { id: "s7", emoji: "⚡", title: "Неделя огня", desc: "Стрик 7 дней", earned: user.longestStreak >= 7 },
    { id: "s30", emoji: "🏆", title: "Железная воля", desc: "Стрик 30 дней", earned: user.longestStreak >= 30 },
    { id: "t100", emoji: "💯", title: "Сотня", desc: "100 решённых заданий", earned: totalTasks >= 100 },
    { id: "acc", emoji: "🎯", title: "Снайпер", desc: "90%+ точность на 30+ ответах", earned: checked >= 30 && (accuracy ?? 0) >= 90 },
    { id: "team", emoji: "🤝", title: "Командный игрок", desc: "Добавь друга", earned: friends.length >= 1 },
  ];

  return {
    name: user.name,
    points: user.points,
    level: levelInfo(user.points),
    streak,
    longestStreak: user.longestStreak,
    activeToday: user.lastActiveDate === today,
    totalTasks,
    accuracy,
    listening,
    reading,
    writing,
    heat,
    days14,
    weekPoints: weekMap.get(userId) ?? 0,
    leaderboard,
    friends: friends.map((f) => ({
      friendshipId: f.friendshipId,
      name: f.name ?? "Без имени",
    })),
    incoming: incoming.map((r) => ({ id: r.id, name: r.requester.name ?? "Без имени" })),
    friendCode,
    badges,
  };
}

export type ProfileStats = NonNullable<Awaited<ReturnType<typeof getProfileStats>>>;
