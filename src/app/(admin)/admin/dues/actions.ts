"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { MONTHLY_DUES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  dueDateForPeriod,
  isValidMonthKey,
  monthKeyFromDate,
  periodFromMonthKey,
} from "@/lib/dues";
import { runDueReminders } from "@/lib/reminders";

const monthSchema = z.string().refine(isValidMonthKey, "Choose a valid month.");

function back(
  month: string,
  message: string,
  tone: "notice" | "error" = "notice",
): never {
  redirect(
    `/admin/dues?month=${month}&${tone}=${encodeURIComponent(message)}`,
  );
}

function refreshDues() {
  revalidatePath("/admin/dues");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/payments");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/payments");
}

export async function generateDuesAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const month = monthSchema.safeParse(formData.get("month"));

  if (!month.success) back(monthKeyFromDate(new Date()), "Choose a valid month.", "error");

  const periodStart = periodFromMonthKey(month.data);
  const dueDate = dueDateForPeriod(periodStart);
  const households = await prisma.household.findMany({
    select: { id: true },
  });

  if (households.length === 0) {
    back(month.data, "There are no households to bill yet.", "error");
  }

  const result = await prisma.due.createMany({
    data: households.map((household) => ({
      householdId: household.id,
      periodStart,
      amount: MONTHLY_DUES,
      dueDate,
    })),
    skipDuplicates: true,
  });

  await logAudit({
    actorUserId: admin.id,
    action: "DUES_GENERATED",
    entityType: "Due",
    entityId: month.data,
    metadata: { created: result.count, households: households.length },
  });

  refreshDues();
  back(
    month.data,
    result.count === 0
      ? `Dues for ${month.data} were already generated.`
      : `Generated ${result.count} due${result.count === 1 ? "" : "s"} for ${month.data}.`,
  );
}

export async function waiveDueAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const dueId = z.string().min(1).safeParse(formData.get("dueId"));
  if (!dueId.success) back(monthKeyFromDate(new Date()), "Choose a valid due.", "error");

  const due = await prisma.due.update({
    where: { id: dueId.data },
    data: { status: "WAIVED" },
  });

  await logAudit({
    actorUserId: admin.id,
    action: "DUE_WAIVED",
    entityType: "Due",
    entityId: due.id,
  });

  refreshDues();
  back(monthKeyFromDate(due.periodStart), "Due waived for this household.");
}

export async function runRemindersAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const month = monthSchema.safeParse(formData.get("month"));

  const result = await runDueReminders();

  await logAudit({
    actorUserId: admin.id,
    action: "REMINDERS_SENT",
    entityType: "ReminderLog",
    metadata: result,
  });

  refreshDues();
  back(
    month.success ? month.data : monthKeyFromDate(new Date()),
    result.sent === 0
      ? `No new reminders to send (${result.skipped} already sent).`
      : `Sent ${result.sent} reminder${result.sent === 1 ? "" : "s"} (${result.skipped} already sent).`,
  );
}
