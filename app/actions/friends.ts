"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Result = { error?: string; ok?: string };

async function me() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Не авторизован");
  return s.user.id;
}

export async function sendFriendRequest(code: string): Promise<Result> {
  const myId = await me();
  const clean = code.trim().toUpperCase();
  if (!clean) return { error: "Введите код друга" };

  const target = await prisma.user.findUnique({
    where: { friendCode: clean },
    select: { id: true, name: true },
  });
  if (!target) return { error: "Пользователь с таким кодом не найден" };
  if (target.id === myId) return { error: "Это ваш собственный код" };

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: myId, addresseeId: target.id },
        { requesterId: target.id, addresseeId: myId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") return { error: "Вы уже в одной команде" };
    if (existing.requesterId === myId) return { error: "Заявка уже отправлена" };
    // встречная заявка — сразу принимаем
    await prisma.friendship.update({
      where: { id: existing.id },
      data: { status: "ACCEPTED" },
    });
    revalidatePath("/profile");
    return { ok: `Теперь вы в команде с ${target.name ?? "другом"}` };
  }

  await prisma.friendship.create({
    data: { requesterId: myId, addresseeId: target.id },
  });
  revalidatePath("/profile");
  return { ok: "Заявка отправлена" };
}

export async function respondToRequest(id: string, accept: boolean) {
  const myId = await me();
  if (accept) {
    await prisma.friendship.updateMany({
      where: { id, addresseeId: myId, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });
  } else {
    await prisma.friendship.deleteMany({
      where: { id, addresseeId: myId, status: "PENDING" },
    });
  }
  revalidatePath("/profile");
}

export async function removeFriend(id: string) {
  const myId = await me();
  await prisma.friendship.deleteMany({
    where: { id, OR: [{ requesterId: myId }, { addresseeId: myId }] },
  });
  revalidatePath("/profile");
}
