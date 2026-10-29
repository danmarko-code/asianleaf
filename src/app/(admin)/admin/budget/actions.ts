"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { dateFromInput } from "@/lib/dates";
import { prisma } from "@/lib/db";

const entrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(2).max(300),
  amount: z.coerce.number().positive().max(10_000_000),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function back(message: string, tone: "notice" | "error" = "notice"): never {
  redirect(`/admin/budget?${tone}=${encodeURIComponent(message)}`);
}

function refreshBudget() {
  revalidatePath("/admin/budget");
  revalidatePath("/app/budget");
  revalidatePath("/app/dashboard");
}

export async function createBudgetEntryAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = entrySchema.safeParse({
    type: formData.get("type"),
    category: formData.get("category"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    occurredAt: formData.get("occurredAt"),
  });

  if (!parsed.success) {
    back(
      "Complete the type, category, description, amount and date.",
      "error",
    );
  }

  const entry = await prisma.budgetEntry.create({
    data: {
      type: parsed.data.type,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      occurredAt: dateFromInput(parsed.data.occurredAt),
      createdById: admin.id,
    },
  });

  await logAudit({
    actorUserId: admin.id,
    action: "BUDGET_ENTRY_CREATED",
    entityType: "BudgetEntry",
    entityId: entry.id,
    metadata: { type: entry.type, amount: Number(entry.amount) },
  });

  refreshBudget();
  back("Budget entry recorded.");
}

export async function deleteBudgetEntryAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const id = z.string().min(1).safeParse(formData.get("entryId"));
  if (!id.success) back("Choose a valid entry.", "error");

  const entry = await prisma.budgetEntry.findUnique({ where: { id: id.data } });
  if (!entry) back("Entry not found.", "error");

  await prisma.budgetEntry.delete({ where: { id: entry.id } });

  await logAudit({
    actorUserId: admin.id,
    action: "BUDGET_ENTRY_DELETED",
    entityType: "BudgetEntry",
    entityId: entry.id,
  });

  refreshBudget();
  back("Budget entry deleted.");
}
