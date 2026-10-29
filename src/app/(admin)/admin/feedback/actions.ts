"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  feedbackId: z.string().min(1),
  status: z.enum(["NEW", "READ", "RESOLVED"]),
  adminNote: z.string().trim().max(1000).optional(),
});

function back(message: string, tone: "notice" | "error" = "notice"): never {
  redirect(`/admin/feedback?${tone}=${encodeURIComponent(message)}`);
}

export async function updateFeedbackAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = updateSchema.safeParse({
    feedbackId: formData.get("feedbackId"),
    status: formData.get("status"),
    adminNote: formData.get("adminNote") || undefined,
  });

  if (!parsed.success) back("Choose a valid feedback record and status.", "error");

  const feedback = await prisma.feedback.findUnique({
    where: { id: parsed.data.feedbackId },
  });
  if (!feedback) back("Feedback record not found.", "error");

  const statusChanged = feedback.status !== parsed.data.status;
  const noteChanged =
    (parsed.data.adminNote ?? "") !== (feedback.adminNote ?? "");

  await prisma.feedback.update({
    where: { id: feedback.id },
    data: {
      status: parsed.data.status,
      adminNote: parsed.data.adminNote ?? null,
    },
  });

  if (statusChanged || noteChanged) {
    await prisma.notification.create({
      data: {
        userId: feedback.userId,
        type: "FEEDBACK_REPLY",
        title:
          parsed.data.status === "RESOLVED"
            ? "Your feedback was resolved"
            : "Feedback updated",
        body:
          parsed.data.adminNote?.trim() ||
          "The association updated the status of your feedback.",
        link: "/app/feedback",
      },
    });
  }

  await logAudit({
    actorUserId: admin.id,
    action: "FEEDBACK_UPDATED",
    entityType: "Feedback",
    entityId: feedback.id,
    metadata: { status: parsed.data.status },
  });

  revalidatePath("/admin/feedback");
  revalidatePath("/app/feedback");
  back("Feedback updated.");
}
