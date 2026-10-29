"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession, requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createOtp, verifyOtp } from "@/lib/otp";

export type PasswordState = {
  error?: string;
  devCode?: string;
  success?: boolean;
};

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/\d/);

function devOnly(code: string) {
  return process.env.NODE_ENV === "production" ? undefined : code;
}

export async function requestChangeCodeAction(
  currentPassword: string,
): Promise<PasswordState> {
  const user = await requireUser();

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return { error: "Your current password is not correct." };
  }

  const code = await createOtp({
    userId: user.id,
    purpose: "CHANGE_PASSWORD",
    channel: "EMAIL",
    email: user.email,
  });

  return {
    devCode: devOnly(code),
  };
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  code: string;
}): Promise<PasswordState> {
  const user = await requireUser();

  const parsed = z
    .object({
      currentPassword: z.string().min(1),
      newPassword: passwordSchema,
      confirmPassword: z.string().min(8).max(72),
      code: z.string().trim().regex(/^\d{6}$/),
    })
    .safeParse(input);

  if (!parsed.success) {
    return {
      error:
        "Use at least 8 characters with upper and lowercase letters and a number, then enter the 6-digit code.",
    };
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { error: "The new passwords do not match." };
  }

  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "Your current password is not correct." };
  }

  if (parsed.data.newPassword === parsed.data.currentPassword) {
    return { error: "Choose a password that is different from the current one." };
  }

  const verified = await verifyOtp({
    userId: user.id,
    purpose: "CHANGE_PASSWORD",
    code: parsed.data.code,
  });

  if (!verified.ok) return { error: verified.reason };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Sign out every other session, then issue a fresh one for this browser.
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);

  await logAudit({
    actorUserId: user.id,
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: user.id,
  });

  return { success: true };
}
