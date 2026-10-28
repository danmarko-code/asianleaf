import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_DAYS } from "@/lib/session-cookie";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const requestHeaders = await headers();

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: requestHeaders.get("user-agent")?.slice(0, 300) ?? null,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  store.delete(SESSION_COOKIE);
}

// Cached for the duration of one request so layouts and pages do not repeat
// the same database lookup.
export const getSessionUser = cache(async () => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          household: true,
          member: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) return null;
  if (session.user.status !== "ACTIVE") return null;

  return session.user;
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();

  if (user.role !== role) {
    redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/app/dashboard");
  }

  return user;
}
