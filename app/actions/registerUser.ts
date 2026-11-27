"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password) {
    return { error: "Заполните все обязательные поля" };
  }

  // Проверяем, есть ли уже такой пользователь в базе Neon
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    if (!existingUser.password) {
      return {
        error: "Этот аккаунт создан через Google. Войдите через Google.",
      };
    }
    return { error: "Пользователь с такой почтой уже существует" };
  }

  // Хэшируем пароль в целях безопасности
  const hashedPassword = await bcrypt.hash(password, 10);

  // Создаем пользователя в базе данных
  await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  return { success: true };
}
