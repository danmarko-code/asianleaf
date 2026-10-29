"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createOtp, verifyOtp } from "@/lib/otp";

export type ResetState = {
  error?: string;
  devCode?: string;
  notice?: string;
  success?: boolean;
};

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/\d/);

export async function requestResetAction(email: string): Promise<ResetState> {
  const parsed = emailSchema.safeParse(email);

  // Always answer the same way so the form cannot be used to discover accounts.
  const generic =
    "If that email belongs to an active account, a 6-digit code has been sent. It expires in 5 minutes.";

  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data },
  });

  if (!user || user.status !== "ACTIVE") {
    return { notice: generic };
  }

  const code = await createOtp({
    userId: user.id,
    purpose: "CHANGE_PASSWORD",
    channel: "EMAIL",
    email: user.email,
  });

  return {
    notice: generic,
    devCode: process.env.NODE_ENV === "production" ? undefined : code,
  };
}

export async function resetPasswordAction(input: {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ResetState> {
  const parsed = z
    .object({
      email: emailSchema,
      code: z.string().trim().regex(/^\d{6}$/),
      newPassword: passwordSchema,
      confirmPassword: z.string().min(8).max(72),
    })
    .safeParse(input);

  if (!parsed.success) {
    return {
      error:
        "Enter the code and a password with at least 8 characters, upper and lowercase letters, and a number.",
    };
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { error: "The new passwords do not match." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return { error: "That code is not valid. Request a new one." };
  }

  const verified = await verifyOtp({
    userId: user.id,
    purpose: "CHANGE_PASSWORD",
    code: parsed.data.code,
  });

  if (!verified.ok) return { error: verified.reason };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);

  await logAudit({
    actorUserId: user.id,
    action: "PASSWORD_RESET",
    entityType: "User",
    entityId: user.id,
  });

  return { success: true };
}
