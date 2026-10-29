import crypto from "node:crypto";
import type { OtpChannel, OtpPurpose } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendMessage } from "@/lib/messaging";

export const OTP_TTL_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 5;

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function createOtp({
  userId,
  purpose,
  channel,
  email,
}: {
  userId: string;
  purpose: OtpPurpose;
  channel: OtpChannel;
  email: string;
}) {
  const code = generateCode();

  await prisma.otpCode.deleteMany({
    where: { userId, purpose, consumedAt: null },
  });

  await prisma.otpCode.create({
    data: {
      userId,
      purpose,
      channel,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  await sendMessage({
    to: email,
    subject: "Your Asian Leaf verification code",
    body: `Your verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
  });

  // No provider is configured, so the code is returned to the caller for the
  // development banner. Production should discard this value.
  return code;
}

export async function verifyOtp({
  userId,
  purpose,
  code,
}: {
  userId: string;
  purpose: OtpPurpose;
  code: string;
}) {
  const record = await prisma.otpCode.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false as const, reason: "No active code. Request a new one." };
  if (record.expiresAt <= new Date()) {
    return { ok: false as const, reason: "That code has expired. Request a new one." };
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false as const, reason: "Too many attempts. Request a new code." };
  }

  if (record.codeHash !== hashCode(code.trim())) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false as const, reason: "That code is not correct." };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true as const };
}
