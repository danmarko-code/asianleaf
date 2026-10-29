"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/money";

const idSchema = z.string().min(1);

function back(message: string, tone: "error" | "notice" = "error"): never {
  redirect(`/admin/payments?${tone}=${encodeURIComponent(message)}`);
}

function refreshPaymentViews() {
  revalidatePath("/admin/payments");
  revalidatePath("/admin/dues");
  revalidatePath("/admin/dashboard");
  revalidatePath("/app/payments");
  revalidatePath("/app/dashboard");
}

export async function approvePaymentAction(formData: FormData) {
  const user = await requireRole("ADMIN");
  const parsed = idSchema.safeParse(formData.get("paymentId"));
  if (!parsed.success) back("Choose a valid payment.");

  const payment = await prisma.payment.findUnique({
    where: { id: parsed.data },
    include: {
      due: {
        include: {
          household: { include: { account: { select: { id: true } } } },
        },
      },
    },
  });

  if (!payment) back("Payment not found.");
  if (payment.status !== "PENDING") {
    back("Only pending payments can be approved.");
  }

  const receiptNumber = `RCPT-${new Date().getFullYear()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        receiptNumber,
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    const paid = await tx.payment.aggregate({
      where: { dueId: payment.dueId, status: "PAID" },
      _sum: { amount: true },
    });

    const total = Number(paid._sum.amount ?? 0);
    await tx.due.update({
      where: { id: payment.dueId },
      data: {
        status: total >= Number(payment.due.amount) ? "PAID" : "PARTIALLY_PAID",
      },
    });

    if (payment.due.household.account) {
      await tx.notification.create({
        data: {
          userId: payment.due.household.account.id,
          type: "PAYMENT_RECEIVED",
          title: "Payment approved",
          body: `We verified ${formatPeso(Number(payment.amount))}. Receipt ${receiptNumber}.`,
          link: "/app/payments",
        },
      });
    }
  });

  await logAudit({
    actorUserId: user.id,
    action: "PAYMENT_APPROVED",
    entityType: "Payment",
    entityId: payment.id,
    metadata: { receiptNumber, amount: Number(payment.amount) },
  });

  refreshPaymentViews();
  back(`Payment approved. Receipt ${receiptNumber}.`, "notice");
}

export async function rejectPaymentAction(formData: FormData) {
  const user = await requireRole("ADMIN");
  const paymentId = idSchema.safeParse(formData.get("paymentId"));
  const reason = z
    .string()
    .trim()
    .min(3)
    .max(300)
    .safeParse(formData.get("reason"));

  if (!paymentId.success) back("Choose a valid payment.");
  if (!reason.success) back("Give a short reason for rejecting the payment.");

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId.data },
    include: {
      due: {
        include: {
          household: { include: { account: { select: { id: true } } } },
        },
      },
    },
  });

  if (!payment) back("Payment not found.");
  if (payment.status !== "PENDING") {
    back("Only pending payments can be rejected.");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "REJECTED",
      rejectionReason: reason.data,
      reviewedById: user.id,
      reviewedAt: new Date(),
    },
  });

  if (payment.due.household.account) {
    await prisma.notification.create({
      data: {
        userId: payment.due.household.account.id,
        type: "GENERAL",
        title: "Payment not verified",
        body: reason.data,
        link: "/app/payments",
      },
    });
  }

  await logAudit({
    actorUserId: user.id,
    action: "PAYMENT_REJECTED",
    entityType: "Payment",
    entityId: payment.id,
    metadata: { reason: reason.data },
  });

  refreshPaymentViews();
  back("Payment rejected. The homeowner can submit a corrected reference.", "notice");
}
