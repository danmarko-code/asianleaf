"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const feedbackSchema = z.object({
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(5).max(2000),
});

function fail(message: string): never {
  redirect(`/app/feedback?error=${encodeURIComponent(message)}`);
}

export async function submitFeedbackAction(formData: FormData) {
  const user = await requireRole("HOMEOWNER");
  const parsed = feedbackSchema.safeParse({
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    fail("Enter a message of at least 5 characters.");
  }

  await prisma.feedback.create({
    data: {
      userId: user.id,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
      status: "NEW",
    },
  });

  revalidatePath("/app/feedback");
  revalidatePath("/admin/feedback");
  redirect("/app/feedback?submitted=1");
}
