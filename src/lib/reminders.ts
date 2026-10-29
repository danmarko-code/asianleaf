import type { ReminderKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendMessage } from "@/lib/messaging";

const DAY_MS = 24 * 60 * 60 * 1000;

function reminderKindFor(dueDate: Date, now: Date): ReminderKind | null {
  const days = Math.ceil((dueDate.getTime() - now.getTime()) / DAY_MS);
  if (days < 0) return "OVERDUE";
  if (days <= 1) return "ONE_DAY";
  if (days <= 7) return "ONE_WEEK";
  if (days <= 30) return "ONE_MONTH";
  return null;
}

// Overdue reminders repeat weekly. Dedupe keys make the job safe to re-run.
function dedupeKeyFor(kind: ReminderKind, now: Date) {
  if (kind !== "OVERDUE") return kind;
  const year = now.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const week = Math.floor((now.getTime() - start) / (7 * DAY_MS)) + 1;
  return `OVERDUE-${year}-W${String(week).padStart(2, "0")}`;
}

export async function runDueReminders() {
  const now = new Date();

  const dues = await prisma.due.findMany({
    where: {
      status: { in: ["UNPAID", "PARTIALLY_PAID"] },
      dueDate: { lte: new Date(now.getTime() + 30 * DAY_MS) },
    },
    include: {
      household: {
        include: {
          members: { take: 1, orderBy: { createdAt: "asc" } },
          account: { select: { id: true, email: true, status: true } },
        },
      },
      payments: { where: { status: "PAID" }, select: { amount: true } },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const due of dues) {
    const paid = due.payments.reduce(
      (total, payment) => total + Number(payment.amount),
      0,
    );
    const balance = Number(due.amount) - paid;
    if (balance <= 0) continue;

    const kind = reminderKindFor(due.dueDate, now);
    if (!kind) continue;

    const dedupeKey = dedupeKeyFor(kind, now);

    const existing = await prisma.reminderLog.findUnique({
      where: { dueId_dedupeKey: { dueId: due.id, dedupeKey } },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.reminderLog.create({
        data: { dueId: due.id, kind, dedupeKey },
      });

      if (due.household.account?.status === "ACTIVE") {
        await tx.notification.create({
          data: {
            userId: due.household.account.id,
            type: kind === "OVERDUE" ? "DUE_OVERDUE" : "DUE_REMINDER",
            title:
              kind === "OVERDUE"
                ? "Dues are overdue"
                : kind === "ONE_DAY"
                  ? "Dues are due tomorrow"
                  : "Upcoming dues",
            body: `PHP ${balance.toFixed(2)} remains for the billing period starting ${due.periodStart.toISOString().slice(0, 10)}.`,
            link: "/app/payments",
          },
        });
      }
    });

    const member = due.household.members[0];
    if (member) {
      await sendMessage({
        to: member.email,
        subject:
          kind === "OVERDUE" ? "Overdue HOA dues" : "Upcoming HOA dues reminder",
        body: `${due.household.unitAddress}: PHP ${balance.toFixed(2)} remains for the billing period starting ${due.periodStart.toISOString().slice(0, 10)}.`,
      });
    }

    sent += 1;
  }

  return { sent, skipped, checked: dues.length };
}
