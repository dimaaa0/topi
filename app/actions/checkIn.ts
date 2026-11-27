"use server";

import { auth } from "@/auth";
import { touchStreak } from "@/lib/activity";

export async function checkIn() {
  const session = await auth();
  if (!session?.user?.id) return;
  await touchStreak(session.user.id);
}
