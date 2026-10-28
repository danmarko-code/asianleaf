"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { dateFromInput } from "@/lib/dates";
import { prisma } from "@/lib/db";

const paymentSchema = z.object({
  dueId: z.string().min(1),
  channelId: z.string().min(1),
  amount: z.coerce.number().positive().max(100000),
  referenceNumber: z.string().trim().min(4).max(80),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(500).optional(),
});

function fail(message: string): never {
  redirect(`/app/payments?error=${encodeURIComponent(message)}`);
}

export async function submitPaymentAction(formData: FormData) {
  const user = await requireRole("HOMEOWNER");
  if (!user.householdId) fail("Your login is not linked to a household yet.");

  const parsed = paymentSchema.safeParse({
    dueId: formData.get("dueId"),
    channelId: formData.get("channelId"),
    amount: formData.get("amount"),
    referenceNumber: formData.get("referenceNumber"),
    paidAt: formData.get("paidAt"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    fail("Enter a valid amount, reference number and payment date.");
  }

  const [due, channel] = await Promise.all([
    prisma.due.findFirst({
      where: { id: parsed.data.dueId, householdId: user.householdId },
      include: {
        payments: {
          where: { status: "PAID" },
          select: { amount: true },
        },
      },
    }),
    prisma.paymentChannel.findFirst({
      where: { id: parsed.data.channelId, isActive: true },
    }),
  ]);

  if (!due || due.status === "PAID" || due.status === "WAIVED") {
    fail("That billing period is no longer open.");
  }

  if (!channel) fail("Choose an active payment channel.");

  const paid = due.payments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );
  const balance = Number(due.amount) - paid;

  if (parsed.data.amount > balance) {
    fail(`The amount cannot be more than the remaining balance of ${balance.toFixed(2)}.`);
  }

  try {
    await prisma.payment.create({
      data: {
        dueId: due.id,
        channelId: channel.id,
        amount: parsed.data.amount,
        method: channel.type,
        status: "PENDING",
        referenceNumber: parsed.data.referenceNumber,
        notes: parsed.data.notes ?? null,
        paidAt: dateFromInput(parsed.data.paidAt),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      fail("That reference number was already submitted.");
    }
    throw error;
  }

  revalidatePath("/app/payments");
  revalidatePath("/app/dashboard");
  redirect("/app/payments?submitted=1");
}
