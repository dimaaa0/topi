"use server";

import { auth } from "@/auth"; // Укажите ваш путь к auth
import {prisma} from "@/lib/prisma"; // Укажите ваш путь к prisma
import { revalidatePath } from "next/cache";

export async function resetWritingProgress() {
    const session = await auth();

    // Проверяем, что пользователь авторизован
    if (!session?.user?.id) {
        throw new Error("Пользователь не авторизован");
    }

    // Обновляем запись пользователя, сбрасывая счетчики на 0 (или null, в зависимости от вашей схемы)
    await prisma.user.update({
        where: {
            id: session.user.id,
        },
        data: {
            completedWritingCount: 0,
            lastWritingNumber: 0,
        },
    });

    // Обновляем кеш страницы, где отображается прогресс (например, страница /writing)
    revalidatePath("/writing");
}