"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveReceipt } from "@/lib/receipts";
import type { PaymentFormState } from "./form-state";

const METHODS = ["CASH", "GCASH", "BANK_TRANSFER", "OTHER"] as const;
const NEEDS_REFERENCE = new Set<string>(["GCASH", "BANK_TRANSFER"]);

const paymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Enter an amount greater than zero.")
    .max(1_000_000, "That amount is too large."),
  method: z.enum(METHODS),
});

export async function submitPaymentAction(
  _previous: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const user = await requireRole("HOMEOWNER");
  const amountInput = String(formData.get("amount") ?? "").trim();
  const methodInput = String(formData.get("method") ?? "").trim();
  const referenceInput = String(formData.get("referenceNumber") ?? "").trim();
  const values = {
    amount: amountInput,
    method: methodInput,
    referenceNumber: referenceInput,
  };

  if (!user.householdId) {
    return { error: "Your login is not linked to a household yet.", values };
  }

  const parsed = paymentSchema.safeParse({
    amount: amountInput,
    method: methodInput,
  });

  const fieldErrors: NonNullable<PaymentFormState["fieldErrors"]> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "amount") fieldErrors.amount = issue.message;
      if (issue.path[0] === "method") fieldErrors.method = issue.message;
    }
  }

  if (referenceInput.length > 80) {
    fieldErrors.referenceNumber = "Keep the reference number under 80 characters.";
  } else if (NEEDS_REFERENCE.has(methodInput) && referenceInput.length < 4) {
    fieldErrors.referenceNumber =
      "Enter the reference number from your transaction receipt.";
  }

  const receipt = formData.get("receipt");
  const file = receipt instanceof File && receipt.size > 0 ? receipt : null;
  // Type and size are checked in saveReceipt, which runs only once the other
  // fields pass.
  if (!file && methodInput !== "CASH") {
    fieldErrors.receipt = "Attach a photo or PDF of your receipt.";
  }

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { error: "Check the highlighted fields and try again.", fieldErrors, values };
  }

  const data = parsed.data;
  const saved = file ? await saveReceipt(file) : null;
  if (saved && "error" in saved) {
    return { error: saved.error, fieldErrors: { receipt: saved.error }, values };
  }

  // Newest open billing period is attached when one exists; a payment without
  // an open due still belongs to the household.
  const due = await prisma.due.findFirst({
    where: { householdId: user.householdId, status: "UNPAID" },
    orderBy: { dueDate: "asc" },
    select: { id: true },
  });

  try {
    await prisma.payment.create({
      data: {
        householdId: user.householdId,
        dueId: due?.id ?? null,
        amount: data.amount,
        method: data.method,
        status: "PENDING",
        referenceNumber: referenceInput || null,
        receiptUrl: saved?.url ?? null,
        paidAt: new Date(),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "That reference number was already submitted.",
        fieldErrors: { referenceNumber: "This reference number is already on file." },
        values,
      };
    }
    throw error;
  }

  revalidatePath("/app/payments");
  revalidatePath("/app/dashboard");
  redirect("/app/payments?submitted=1");
}
