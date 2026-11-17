"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { dateFromInput } from "@/lib/dates";
import { prisma } from "@/lib/db";
import {
  MAX_CATEGORY_DETAIL,
  OTHER_CATEGORY,
  VIOLATION_CATEGORIES,
} from "@/lib/violations";
import type { ViolationFormState } from "./form-state";

const violationSchema = z.object({
  householdId: z.string().min(1),
  memberId: z.string().optional(),
  kind: z.enum(["WARNING", "PAYMENT_REQUIRED"]),
  category: z.enum(VIOLATION_CATEGORIES),
  categoryDetail: z.string().trim().max(MAX_CATEGORY_DETAIL).optional(),
  description: z.string().trim().min(5).max(1000),
  issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fineAmount: z.string().optional(),
});

function fail(message: string): never {
  redirect(`/admin/violations?error=${encodeURIComponent(message)}`);
}

function refreshViolationViews() {
  revalidatePath("/admin/violations");
  revalidatePath("/app/violations");
  revalidatePath("/app/dashboard");
}

export async function createViolationAction(
  _previous: ViolationFormState,
  formData: FormData,
): Promise<ViolationFormState> {
  const user = await requireRole("ADMIN");

  const parsed = violationSchema.safeParse({
    householdId: formData.get("householdId"),
    memberId: formData.get("memberId") || undefined,
    kind: formData.get("kind"),
    category: formData.get("category"),
    categoryDetail: formData.get("categoryDetail") || undefined,
    description: formData.get("description"),
    issuedAt: formData.get("issuedAt"),
    dueDate: formData.get("dueDate") || undefined,
    fineAmount: formData.get("fineAmount") || undefined,
  });

  if (!parsed.success) {
    const badCategory = parsed.error.issues.some(
      (issue) => issue.path[0] === "category",
    );
    if (badCategory) {
      return {
        error: "Choose a violation category from the list.",
        fieldErrors: { category: "Choose a violation category." },
      };
    }
    return { error: "Complete the household, description and date." };
  }

  const household = await prisma.household.findUnique({
    where: { id: parsed.data.householdId },
    include: { members: true },
  });

  if (!household) return { error: "Household not found." };

  const member = parsed.data.memberId
    ? household.members.find((row) => row.id === parsed.data.memberId)
    : null;

  if (parsed.data.memberId && !member) {
    return { error: "Choose a resident from the selected household." };
  }

  if (parsed.data.kind === "PAYMENT_REQUIRED") {
    const fine = Number(parsed.data.fineAmount);
    if (!Number.isFinite(fine) || fine <= 0) {
      return { error: "Enter the amount the resident needs to pay." };
    }
    if (!parsed.data.dueDate) {
      return { error: "Choose the payment due date." };
    }
  }

  // "Other" keeps its note in the same column, so every screen that prints the
  // category keeps working without a second field.
  const category =
    parsed.data.category === OTHER_CATEGORY && parsed.data.categoryDetail
      ? `${OTHER_CATEGORY}: ${parsed.data.categoryDetail}`
      : parsed.data.category;

  const violation = await prisma.violation.create({
    data: {
      householdId: household.id,
      memberId: member?.id ?? null,
      kind: parsed.data.kind,
      category,
      description: parsed.data.description,
      status: "OPEN",
      fineAmount:
        parsed.data.kind === "PAYMENT_REQUIRED"
          ? Number(parsed.data.fineAmount)
          : null,
      issuedAt: dateFromInput(parsed.data.issuedAt),
      dueDate:
        parsed.data.kind === "PAYMENT_REQUIRED" && parsed.data.dueDate
          ? dateFromInput(parsed.data.dueDate)
          : null,
      issuedById: user.id,
    },
  });

  await logAudit({
    actorUserId: user.id,
    action: "VIOLATION_ISSUED",
    entityType: "Violation",
    entityId: violation.id,
    metadata: { householdId: household.id, kind: violation.kind },
  });

  refreshViolationViews();
  redirect(
    `/admin/violations?notice=${encodeURIComponent("Violation issued to the resident.")}`,
  );
}

export async function updateViolationStatusAction(formData: FormData) {
  const user = await requireRole("ADMIN");
  const id = z.string().min(1).safeParse(formData.get("violationId"));
  const status = z
    .enum(["RESOLVED", "DISMISSED"])
    .safeParse(formData.get("status"));

  if (!id.success || !status.success) fail("Choose a valid violation.");

  const violation = await prisma.violation.update({
    where: { id: id.data },
    data: {
      status: status.data,
      resolvedAt: new Date(),
    },
  });

  await logAudit({
    actorUserId: user.id,
    action:
      status.data === "RESOLVED" ? "VIOLATION_RESOLVED" : "VIOLATION_DISMISSED",
    entityType: "Violation",
    entityId: violation.id,
  });

  refreshViolationViews();
  redirect(
    `/admin/violations?notice=${encodeURIComponent(
      status.data === "RESOLVED"
        ? "Violation marked resolved."
        : "Violation dismissed.",
    )}`,
  );
}
