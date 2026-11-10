"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9._-]+$/),
  password: z.string().min(1).max(200),
});

function loginError(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    loginError("Enter your username and password.");
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });

  if (!user) {
    loginError("Incorrect username or password.");
  }

  if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    loginError("Incorrect username or password.");
  }

  if (user.status === "DISABLED") {
    loginError("This account has been disabled. Contact the association office.");
  }

  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/app/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
