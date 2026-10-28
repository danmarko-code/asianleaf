"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

function loginError(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    loginError("Enter a valid email address and password.");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    loginError("Incorrect email or password.");
  }

  if (user.status === "PENDING") {
    loginError("This account is still waiting for confirmation.");
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
